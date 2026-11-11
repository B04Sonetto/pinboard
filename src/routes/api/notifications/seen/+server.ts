import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Sign in to update notifications.' }, { status: 401 });

	const { error } = await locals.supabase
		.from('profiles')
		.update({ notifications_seen_at: new Date().toISOString() })
		.eq('id', locals.user.id);

	if (error) return json({ error: 'Could not mark notifications as read.' }, { status: 400 });
	return json({ ok: true });
};
