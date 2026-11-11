import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note, StudyDifficulty, StudyKind } from '$lib/types';
import { NOTE_CARD_SELECT, NOTE_FULL_SELECT, loadTaxonomy } from '$lib/server/queries';
import { generateStudy, type StudySource } from '$lib/server/study-engine';
import { stripMarkdown } from '$lib/utils';
import { checkRateLimit } from '$lib/server/rate-limit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS: StudyKind[] = ['reviewer', 'summary', 'quiz', 'exam', 'keywords'];
const DIFFICULTIES: StudyDifficulty[] = ['easy', 'standard', 'challenge'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const taxonomy = await loadTaxonomy(supabase);

	const [notesResult, recentResult] = await Promise.all([
		supabase
			.from('notes')
			.select(`${NOTE_CARD_SELECT}, content_text`)
			.eq('status', 'verified')
			.order('downloads', { ascending: false })
			.limit(150),
		supabase
			.from('ai_generations')
			.select('id, kind, title, created_at, subject:subjects(code, name), topic:topics(name)')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(8)
	]);

	const notes = (notesResult.data ?? []) as unknown as Note[];
	const presetIds = (url.searchParams.get('notes') ?? '')
		.split(',')
		.map((id) => id.trim())
		.filter((id) => UUID.test(id))
		.filter((id) => notes.some((note) => note.id === id));

	const subjectParam = url.searchParams.get('subject') ?? '';
	const topicParam = url.searchParams.get('topic') ?? '';
	const departmentParam = url.searchParams.get('department') ?? '';
	const firstPreset = notes.find((note) => note.id === presetIds[0]);

	return {
		taxonomy,
		notes,
		recent: (recentResult.data ?? []) as unknown as {
			id: string;
			kind: StudyKind;
			title: string;
			created_at: string;
			subject: { code: string; name: string } | null;
			topic: { name: string } | null;
		}[],
		preset: {
			notes: presetIds,
			department: firstPreset?.department_id ?? departmentParam,
			subject: firstPreset?.subject_id ?? subjectParam,
			topic: firstPreset?.topic_id ?? topicParam
		},
		error: notesResult.error ? notesResult.error.message : null
	};
};

export const actions: Actions = {
	generate: async ({ request, locals }) => {
		if (!checkRateLimit(`study:${locals.user!.id}`, 10, 60_000)) {
			return fail(429, { error: 'Too many generation requests. Please wait a minute before generating again.' });
		}
		const form = await request.formData();
		const kind = String(form.get('kind') ?? 'reviewer') as StudyKind;
		const noteIds = [
			...new Set(
				form
					.getAll('note_ids')
					.map((value) => String(value))
					.filter((value) => UUID.test(value))
			)
		].slice(0, 8);
		const ownNotes = String(form.get('own_notes') ?? '').trim().slice(0, 30_000);
		const focus = String(form.get('focus') ?? '').trim().slice(0, 240);
		const questionCount = Number.parseInt(String(form.get('question_count') ?? '8'), 10) || 8;
		const examTimeLimit = Number.parseInt(String(form.get('exam_time') ?? '45'), 10) || 45;
		const examSections = form
			.getAll('exam_sections')
			.map((value) => String(value))
			.filter((value) => ['multiple_choice', 'true_false', 'identification', 'essay'].includes(value));
		const difficultyRaw = String(form.get('difficulty') ?? 'standard') as StudyDifficulty;
		const difficulty = DIFFICULTIES.includes(difficultyRaw) ? difficultyRaw : 'standard';
		const departmentId = String(form.get('department_id') ?? '') || null;
		const subjectId = String(form.get('subject_id') ?? '') || null;
		const topicId = String(form.get('topic_id') ?? '') || null;

		const values = {
			kind,
			department: departmentId ?? '',
			subject: subjectId ?? '',
			topic: topicId ?? '',
			focus,
			question_count: String(questionCount),
			exam_time: String(examTimeLimit),
			difficulty,
			own_notes_len: String(ownNotes.length)
		};

		if (!KINDS.includes(kind)) return fail(400, { error: 'Choose a study material type.', ...values });
		if (noteIds.length === 0 && ownNotes.length < 80) {
			return fail(400, {
				error: 'Choose at least one community note, or paste enough of your own notes (80+ characters) to work with.',
				...values
			});
		}

		let sourceRows: Note[] = [];
		if (noteIds.length > 0) {
			const { data, error } = await locals.supabase.from('notes').select(`${NOTE_FULL_SELECT}`).in('id', noteIds);
			if (error) return fail(400, { error: 'Could not load the selected notes. Refresh and try again.', ...values });
			sourceRows = (data ?? []) as unknown as Note[];
			if (sourceRows.length === 0) return fail(400, { error: 'None of the selected notes are available.', ...values });
			const byId = new Map(sourceRows.map((note) => [note.id, note]));
			sourceRows = noteIds.map((id) => byId.get(id)).filter((note): note is Note => Boolean(note));
		}

		const sources: StudySource[] = sourceRows.map((note) => ({
			id: note.id,
			title: note.title,
			status: note.status,
			summary: note.summary,
			content: note.content_text || note.content || note.summary,
			keywords: note.keywords,
			subject: note.subject?.code ?? null,
			topic: note.topic?.name ?? null
		}));

		if (sources.length === 0 && ownNotes.length >= 80) {
			sources.push({
				id: 'own-notes',
				title: 'Your attached notes',
				status: 'submitted',
				summary: ownNotes.slice(0, 220),
				content: ownNotes,
				keywords: []
			});
		}

		let result;
		try {
			result = generateStudy(kind, sources, {
				ownNotes: sources.some((source) => source.id === 'own-notes') ? '' : ownNotes,
				questionCount,
				focus,
				difficulty,
				examTimeLimit,
				examSections
			});
		} catch (error) {
			return fail(400, {
				error: error instanceof Error ? error.message : 'Could not generate study material.',
				...values
			});
		}

		const subject = sourceRows[0]?.subject_id ?? subjectId;
		const topic = sourceRows[0]?.topic_id ?? topicId;
		const department = sourceRows[0]?.department_id ?? departmentId;

		const { data: inserted, error: insertError } = await locals.supabase
			.from('ai_generations')
			.insert({
				user_id: locals.user!.id,
				kind,
				title: result.title.slice(0, 200),
				content: result.content,
				payload: result.payload,
				source_note_ids: sourceRows.map((note) => note.id),
				department_id: department,
				subject_id: subject,
				topic_id: topic
			})
			.select('id')
			.single();

		if (insertError || !inserted) {
			return fail(400, {
				error: 'Could not save the generated material. Check that the database schema is up to date.',
				...values
			});
		}

		redirect(303, `/study/${inserted.id}`);
	}
};
