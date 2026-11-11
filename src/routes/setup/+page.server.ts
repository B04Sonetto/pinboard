import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { databaseMissing } from '$lib/supabase/server';

export const load: PageServerLoad = async ({ locals }) => {
	// A presence check works even for signed-out visitors: a missing table
	// returns a PostgREST error, while an existing table returns no rows.
	const [departments, notes] = await Promise.all([
		locals.supabase.from('departments').select('id').limit(1),
		locals.supabase.from('notes').select('id').limit(1)
	]);

	const error = departments.error ?? notes.error;
	const ready = !error;
	if (ready && locals.user) redirect(303, '/dashboard');

	return {
		ready,
		detail: error && !databaseMissing(error) ? error.message : null
	};
};
