import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	return { signedIn: Boolean(locals.user), origin: url.origin };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();

		if (!emailPattern.test(email)) {
			return fail(400, { error: 'Enter the email address linked to your account.', email });
		}

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent('/auth/reset')}`
		});

		if (error && !/rate limit|too many/i.test(error.message)) {
			// Do not reveal whether an address is registered to strangers.
			console.error('Password reset error:', error.message);
		}

		return { success: true, email };
	}
};
