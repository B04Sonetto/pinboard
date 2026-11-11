import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { safeNext } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		redirect(303, safeNext(url.searchParams.get('redirect')));
	}
	return {
		next: safeNext(url.searchParams.get('redirect')),
		setupRequired: locals.setupRequired,
		authError: url.searchParams.get('error')
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const next = safeNext(String(form.get('next') ?? url.searchParams.get('redirect') ?? ''));

		if (!email || !/^\d{4}-\d{4}@lspu\.edu\.ph$/i.test(email)) {
			return fail(400, { error: 'Use your LSPU student email in the format 0000-0000@lspu.edu.ph.', email, next });
		}
		if (!password) {
			return fail(400, { error: 'Enter your password.', email, next });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			const message =
				error.message.toLowerCase().includes('invalid login')
					? 'That email and password do not match. Check both and try again.'
					: error.message.toLowerCase().includes('email not confirmed')
						? 'Your email is not confirmed yet. Check your inbox for the confirmation link.'
						: error.message;
			return fail(400, { error: message, email, next });
		}

		redirect(303, next);
	}
};
