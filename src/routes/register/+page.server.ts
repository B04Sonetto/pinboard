import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { safeNext } from '$lib/utils';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) redirect(303, safeNext(url.searchParams.get('redirect')));
	return {};
};

const lspuEmailPattern = /^\d{4}-\d{4}@lspu\.edu\.ph$/;

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const fullName = String(form.get('full_name') ?? '').trim();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');
		const terms = form.get('terms') === 'on';
		const next = safeNext(String(form.get('next') ?? ''));

		const values = { fullName, email, next };

		if (fullName.length < 2) {
			return fail(400, { error: 'Enter your full name so contributors can be credited.', ...values });
		}
		if (!lspuEmailPattern.test(email)) {
			return fail(400, {
				error: 'Use your LSPU student email in the format 0000-0000@lspu.edu.ph.',
				...values
			});
		}
		if (password.length < 8) {
			return fail(400, { error: 'Use at least 8 characters for your password.', ...values });
		}
		if (password !== confirm) {
			return fail(400, { error: 'The two passwords do not match.', ...values });
		}
		if (!terms) {
			return fail(400, { error: 'Please agree to the community guidelines to continue.', ...values });
		}

		const { data, error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: fullName },
				emailRedirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`
			}
		});

		if (error) {
			const message = error.message.toLowerCase().includes('already registered')
				? 'An account with this email already exists. Try signing in instead.'
				: error.message;
			return fail(400, { error: message, ...values });
		}

		if (data.session) {
			redirect(303, next);
		}

		return {
			success: true,
			email,
			fullName,
			next
		};
	}
};
