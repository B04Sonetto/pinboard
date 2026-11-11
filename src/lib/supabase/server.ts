import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

export function createSupabaseServerClient(event: RequestEvent) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});
}

export function databaseMissing(error: { message?: string; code?: string } | null): boolean {
	if (!error) return false;
	const message = (error.message ?? '').toLowerCase();
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		message.includes('could not find the table') ||
		message.includes('relation') && message.includes('does not exist') ||
		message.includes('schema cache')
	);
}
