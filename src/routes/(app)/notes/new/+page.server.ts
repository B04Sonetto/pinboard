import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note, Subject } from '$lib/types';
import { loadTaxonomy } from '$lib/server/queries';
import { extractFile, extensionOf, isSupportedFile, MAX_FILE_BYTES, sanitizeFileName } from '$lib/server/extract';
import { keywordTerms } from '$lib/keywords';
import { noteWriteErrorMessage } from '$lib/server/write-errors';
import { safeHttpUrl, stripMarkdown } from '$lib/utils';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const taxonomy = await loadTaxonomy(supabase);
	const from = url.searchParams.get('from');
	const requestedSubject = url.searchParams.get('subject');
	let revision: Note | null = null;

	if (from && UUID.test(from)) {
		const { data } = await supabase.from('notes').select('*').eq('id', from).eq('author_id', locals.user!.id).maybeSingle();
		revision = (data as Note | null) ?? null;
	}

	const presetSubject =
		requestedSubject && UUID.test(requestedSubject)
			? taxonomy.subjects.find((subject) => subject.id === requestedSubject)
			: undefined;

	const userDeptId = locals.profile?.department_id ?? '';
	const enrolledDepartment = taxonomy.departments.find((d) => d.id === userDeptId) ?? null;

	return {
		taxonomy,
		revision,
		enrolledDepartment,
		defaults: {
			department: enrolledDepartment?.id ?? revision?.department_id ?? presetSubject?.department_id ?? '',
			program: revision?.program_id ?? presetSubject?.program_id ?? locals.profile?.program_id ?? '',
			subject: revision?.subject_id ?? presetSubject?.id ?? '',
			year_level: revision?.year_level ?? locals.profile?.year_level ?? null,
			semester: revision?.semester ?? locals.profile?.semester ?? null
		}
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Your session expired. Sign in again, then resubmit the note.' });
		}
		const form = await request.formData();
		const department = String(form.get('department_id') ?? '').trim();
		const program = String(form.get('program_id') ?? '').trim() || null;
		const subject = String(form.get('subject_id') ?? '').trim();
		const topic = String(form.get('topic_id') ?? '').trim() || null;
		const title = String(form.get('title') ?? '').trim();
		const summary = String(form.get('summary') ?? '').trim();
		const content = String(form.get('content') ?? '').trim();
		const visibility = String(form.get('visibility') ?? 'community');
		const yearLevel = Number.parseInt(String(form.get('year_level') ?? ''), 10) || null;
		const semester = Number.parseInt(String(form.get('semester') ?? ''), 10) || null;
		const keywordsInput = String(form.get('keywords') ?? '').trim();
		const sourceUrlRaw = String(form.get('source_url') ?? '').trim();
		const revisionOf = String(form.get('revision_of') ?? '').trim();
		const file = form.get('file');

		const values = {
			department,
			program: program ?? '',
			subject,
			topic: topic ?? '',
			title,
			summary,
			content,
			visibility,
			year_level: yearLevel ? String(yearLevel) : '',
			semester: semester ? String(semester) : '',
			keywords: keywordsInput,
			source_url: sourceUrlRaw
		};

		if (!department) return fail(400, { error: 'Choose a department.', ...values });
		const userDeptId = locals.profile?.department_id;
		if (userDeptId && department !== userDeptId) {
			return fail(400, {
				error: 'You can only post notes for your enrolled department. Cross-department posting is disabled.',
				...values
			});
		}
		if (!subject || !UUID.test(subject)) return fail(400, { error: 'Choose a subject for this note.', ...values });
		if (title.length < 4) return fail(400, { error: 'Give the note a title of at least 4 characters.', ...values });
		if (title.length > 200) return fail(400, { error: 'Keep the title under 200 characters.', ...values });
		if (summary.length < 20) {
			return fail(400, { error: 'Write a short summary (at least 20 characters) so students know what is inside.', ...values });
		}
		if (summary.length > 600) {
			return fail(400, { error: 'Keep the summary under 600 characters.', ...values });
		}
		if (content.length > 120_000) {
			return fail(400, { error: 'That note is too long. Keep the body under 120,000 characters.', ...values });
		}
		if (content.length < 80 && (!(file instanceof File) || file.size === 0)) {
			return fail(400, { error: 'Add at least a short note body or attach a file.', ...values });
		}
		if (visibility !== 'community' && visibility !== 'department') {
			return fail(400, { error: 'Choose a valid visibility.', ...values });
		}
		if (sourceUrlRaw.length > 500) {
			return fail(400, { error: 'Keep the source link under 500 characters.', ...values });
		}
		const sourceUrl = sourceUrlRaw ? safeHttpUrl(sourceUrlRaw) : null;
		if (sourceUrlRaw && !sourceUrl) {
			return fail(400, { error: 'The source link must start with http:// or https://.', ...values });
		}

		let revisionSourceId: string | null = null;
		if (revisionOf) {
			if (!UUID.test(revisionOf)) return fail(400, { error: 'That revision link is invalid.', ...values });
			const { data: original } = await locals.supabase
				.from('notes')
				.select('id, author_id, status')
				.eq('id', revisionOf)
				.maybeSingle();
			if (!original || original.author_id !== locals.user!.id) {
				return fail(400, { error: 'You can only revise your own notes.', ...values });
			}
			revisionSourceId = original.id;
		}

		const { data: subjectRow } = await locals.supabase
			.from('subjects')
			.select('*')
			.eq('id', subject)
			.maybeSingle();
		const subjectData = subjectRow as Subject | null;
		if (!subjectData) return fail(400, { error: 'That subject no longer exists.', ...values });

		if (userDeptId && subjectData.department_id !== userDeptId) {
			return fail(400, {
				error: 'The selected subject does not belong to your enrolled department.',
				...values
			});
		}

		if (!userDeptId && department) {
			await locals.supabase
				.from('profiles')
				.update({ department_id: department })
				.eq('id', locals.user!.id);
		}

		if (topic) {
			const { data: topicRow } = await locals.supabase
				.from('topics')
				.select('id, subject_id')
				.eq('id', topic)
				.maybeSingle();
			if (!topicRow || topicRow.subject_id !== subject) {
				return fail(400, { error: 'Choose a topic that belongs to the selected subject.', ...values });
			}
		}

		let filePath: string | null = null;
		let fileName: string | null = null;
		let fileSize: number | null = null;
		let fileType: string | null = null;
		let extractedText = '';

		if (file instanceof File && file.size > 0) {
			if (!isSupportedFile(file.name)) {
				return fail(400, { error: 'Attach a PDF, DOCX, TXT or Markdown file.', ...values });
			}
			if (file.size > MAX_FILE_BYTES) {
				return fail(400, { error: 'Attachments must be 15 MB or smaller.', ...values });
			}

			try {
				const extracted = await extractFile(file);
				extractedText = extracted.text;
			} catch (error) {
				if (content.length < 80) {
					return fail(400, {
						error: error instanceof Error ? error.message : 'Could not read that file. Paste the text instead.',
						...values
					});
				}
			}

			const path = `${locals.user!.id}/${crypto.randomUUID()}.${extensionOf(file.name)}`;
			const { error: uploadError } = await locals.supabase.storage.from('note-files').upload(path, file, {
				cacheControl: '3600',
				upsert: false,
				contentType: file.type || undefined
			});

			if (uploadError) {
				return fail(400, { error: `Could not upload the attachment: ${uploadError.message}`, ...values });
			}

			filePath = path;
			fileName = sanitizeFileName(file.name);
			fileSize = file.size;
			fileType = extensionOf(file.name);
		}

		const body = content || extractedText;
		const keywords = keywordsInput
			? keywordsInput
					.split(',')
					.map((keyword) => keyword.trim().toLowerCase().slice(0, 40))
					.filter(Boolean)
					.slice(0, 12)
			: keywordTerms(`${title} ${summary} ${body}`, 10);

		const { data: inserted, error: insertError } = await locals.supabase
			.from('notes')
			.insert({
				author_id: locals.user!.id,
				department_id: subjectData.department_id,
				program_id: subjectData.program_id,
				subject_id: subject,
				topic_id: topic,
				title,
				summary,
				content: body,
				content_text: stripMarkdown(body),
				visibility,
				status: 'verified',
				origin: 'student',
				year_level: yearLevel ?? subjectData.year_level,
				semester: semester ?? subjectData.semester,
				keywords,
				source_url: sourceUrl,
				revision_of: revisionSourceId,
				file_path: filePath,
				file_name: fileName,
				file_size: fileSize,
				file_type: fileType
			})
			.select('id')
			.single();

		if (insertError || !inserted) {
			console.error('[notes/new] insert failed', insertError);
			if (filePath) await locals.supabase.storage.from('note-files').remove([filePath]);
			return fail(400, {
				error: noteWriteErrorMessage(insertError, 'save'),
				...values
			});
		}

		redirect(303, `/notes/${inserted.id}?notice=published`);
	}
};
