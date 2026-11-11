import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { safeNext } from '$lib/utils';

export const GET: RequestHandler = async ({ url, locals }) => {
	const next = safeNext(url.searchParams.get('next') ?? url.searchParams.get('redirect'));
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const errorDescription = url.searchParams.get('error_description');

	if (errorDescription) {
		redirect(303, `/login?error=${encodeURIComponent(errorDescription)}`);
	}

	try {
		if (code) {
			const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
			if (error) {
				redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
			}
		} else if (tokenHash && type) {
			const { error } = await locals.supabase.auth.verifyOtp({
				token_hash: tokenHash,
				type: type as 'signup' | 'recovery' | 'email' | 'email_change' | 'invite' | 'magiclink'
			});
			if (error) {
				redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
			}
		}
	} catch (error) {
		if (error && typeof error === 'object' && 'status' in error) throw error;
		redirect(303, `/login?error=${encodeURIComponent('That link is invalid or has expired. Request a new one.')}`);
	}

	redirect(303, next);
};
