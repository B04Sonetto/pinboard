import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { isLspuStudentEmail, normalizeLspuEmail } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	return { signedIn: Boolean(locals.user), origin: url.origin };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = normalizeLspuEmail(String(form.get('email') ?? ''));

		if (!isLspuStudentEmail(email)) {
			return fail(400, { error: 'Use the LSPU student email on your account, for example 0324-0574@lspu.edu.ph.', email });
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
