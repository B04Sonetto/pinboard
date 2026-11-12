import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { bookmarkErrorMessage } from '$lib/server/write-errors';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Sign in to bookmark topics.' }, { status: 401 });

	let payload: { topicId?: string; saved?: boolean };
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const topicId = payload.topicId ?? '';
	if (!UUID.test(topicId)) return json({ error: 'Unknown topic.' }, { status: 400 });

	const saved = Boolean(payload.saved);

	if (saved) {
		const { error } = await locals.supabase
			.from('topic_bookmarks')
			.upsert(
				{ user_id: locals.user.id, topic_id: topicId },
				{ onConflict: 'user_id,topic_id', ignoreDuplicates: true }
			);
		if (error) return json({ error: bookmarkErrorMessage(error) }, { status: 400 });
	} else {
		const { error } = await locals.supabase
			.from('topic_bookmarks')
			.delete()
			.eq('user_id', locals.user.id)
			.eq('topic_id', topicId);
		if (error) return json({ error: 'Could not remove this topic bookmark.' }, { status: 400 });
	}

	return json({ saved });
};
