import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note } from '$lib/types';
import { NOTE_CARD_SELECT, NOTE_FULL_SELECT, savedNoteIds } from '$lib/server/queries';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!UUID.test(params.id)) throw error(404, 'Note not found.');

	const supabase = locals.supabase;
	const { data, error: noteError } = await supabase
		.from('notes')
		.select(NOTE_FULL_SELECT)
		.eq('id', params.id)
		.maybeSingle();

	if (noteError || !data) throw error(404, 'This note was not found, or you do not have access to it.');

	const note = data as unknown as Note;
	const profile = locals.profile!;
	const canModerate = profile.role === 'moderator' || profile.role === 'admin';
	const isAuthor = note.author_id === locals.user!.id;

	await supabase.rpc('record_note_view', { target_note: note.id });

	const [bookmark, subjectRelated, keywordRelated, report] = await Promise.all([
		supabase.from('bookmarks').select('note_id').eq('user_id', locals.user!.id).eq('note_id', note.id).maybeSingle(),
		supabase
			.from('notes')
			.select(NOTE_CARD_SELECT)
			.eq('subject_id', note.subject_id)
			.neq('id', note.id)
			.eq('status', 'verified')
			.order('downloads', { ascending: false })
			.limit(4),
		note.keywords && note.keywords.length > 0
			? supabase
					.from('notes')
					.select(NOTE_CARD_SELECT)
					.overlaps('keywords', note.keywords)
					.neq('id', note.id)
					.eq('status', 'verified')
					.limit(4)
			: Promise.resolve({ data: [] }),
		supabase
			.from('reports')
			.select('id, status')
			.eq('reporter_id', locals.user!.id)
			.eq('note_id', note.id)
			.eq('status', 'open')
			.maybeSingle()
	]);

	// Prioritize notes with keyword overlap, then fill remaining slots with same-subject notes
	const seenIds = new Set<string>();
	const combinedRelated: Note[] = [];
	for (const item of (keywordRelated.data ?? []) as unknown as Note[]) {
		if (!seenIds.has(item.id)) {
			seenIds.add(item.id);
			combinedRelated.push(item);
		}
	}
	for (const item of (subjectRelated.data ?? []) as unknown as Note[]) {
		if (!seenIds.has(item.id) && combinedRelated.length < 4) {
			seenIds.add(item.id);
			combinedRelated.push(item);
		}
	}

	const savedIds = await savedNoteIds(supabase, locals.user!.id, combinedRelated.map((item) => item.id));

	return {
		note,
		saved: Boolean(bookmark.data),
		related: combinedRelated,
		savedIds: [...savedIds],
		canModerate,
		isAuthor,
		alreadyReported: Boolean(report.data),
		notice: url.searchParams.get('notice')
	};
};

export const actions: Actions = {
	report: async ({ request, locals, params }) => {
		const form = await request.formData();
		const reason = String(form.get('reason') ?? '').trim();
		const details = String(form.get('details') ?? '').trim();

		if (!reason) return fail(400, { reportError: 'Choose a reason for the report.' });
		if (details.length > 2000) return fail(400, { reportError: 'Keep the details under 2,000 characters.' });

		const { error: reportError } = await locals.supabase.from('reports').insert({
			reporter_id: locals.user!.id,
			note_id: params.id,
			reason,
			details
		});

		if (reportError) return fail(400, { reportError: 'Could not send the report. Try again.' });
		return { reportSuccess: true };
	},

	delete: async ({ locals, params }) => {
		const { data: note } = await locals.supabase
			.from('notes')
			.select('file_path')
			.eq('id', params.id)
			.maybeSingle();

		const { error: deleteError } = await locals.supabase.from('notes').delete().eq('id', params.id);
		if (deleteError) return fail(400, { actionError: 'Could not delete this note.' });

		if (note?.file_path) {
			await locals.supabase.storage.from('note-files').remove([note.file_path]);
		}

		redirect(303, '/notes');
	},

	verify: async ({ request, locals, params }) => {
		const form = await request.formData();
		const note = String(form.get('moderator_note') ?? '').trim();
		const { error: updateError } = await locals.supabase
			.from('notes')
			.update({
				status: 'verified',
				verified_by: locals.user!.id,
				verified_at: new Date().toISOString(),
				moderator_note: note || null
			})
			.eq('id', params.id);

		if (updateError) return fail(400, { actionError: 'Could not verify this note.' });
		redirect(303, `/notes/${params.id}?notice=verified`);
	},

	reject: async ({ request, locals, params }) => {
		const form = await request.formData();
		const note = String(form.get('moderator_note') ?? '').trim();
		const { error: updateError } = await locals.supabase
			.from('notes')
			.update({
				status: 'rejected',
				verified_by: locals.user!.id,
				moderator_note: note || 'Returned for revision. Add more detail and cite your source.'
			})
			.eq('id', params.id);

		if (updateError) return fail(400, { actionError: 'Could not return this note.' });
		redirect(303, `/notes/${params.id}?notice=returned`);
	}
};
