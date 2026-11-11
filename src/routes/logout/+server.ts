import { redirect } from '@sveltejs/kit';
import type { RequestEvent, RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ locals }: RequestEvent) => {
	await locals.supabase.auth.signOut();
	redirect(303, '/login');
};
