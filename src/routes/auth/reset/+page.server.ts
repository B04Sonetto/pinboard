import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}
	return { email: locals.user.email ?? '' };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');

		if (password.length < 8) {
			return fail(400, { error: 'Use at least 8 characters for your password.' });
		}
		if (password !== confirm) {
			return fail(400, { error: 'The two passwords do not match.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { error: error.message });
		}

		redirect(303, '/dashboard?notice=password-updated');
	}
};
