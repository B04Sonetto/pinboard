import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookmarkErrorMessage } from '$lib/server/write-errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Sign in to save notes.' }, { status: 401 });

	let payload: { noteId?: string; saved?: boolean };
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const noteId = payload.noteId ?? '';
	if (!UUID.test(noteId)) return json({ error: 'Unknown note.' }, { status: 400 });

	const saved = Boolean(payload.saved);

	if (saved) {
		const { error } = await locals.supabase
			.from('bookmarks')
			.upsert(
				{ user_id: locals.user.id, note_id: noteId },
				{ onConflict: 'user_id,note_id', ignoreDuplicates: true }
			);
		if (error) return json({ error: bookmarkErrorMessage(error) }, { status: 400 });
	} else {
		const { error } = await locals.supabase
			.from('bookmarks')
			.delete()
			.eq('user_id', locals.user.id)
			.eq('note_id', noteId);
		if (error) return json({ error: 'Could not remove this note from your collection.' }, { status: 400 });
	}

	return json({ saved });
};
