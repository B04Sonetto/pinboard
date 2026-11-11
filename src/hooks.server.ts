import type { Handle } from '@sveltejs/kit';
import { createSupabaseServerClient, databaseMissing } from '$lib/supabase/server';
import type { Profile } from '$lib/types';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createSupabaseServerClient(event);
	event.locals.user = null;
	event.locals.profile = null;
	event.locals.setupRequired = false;

	try {
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();

		event.locals.user = user;

		if (user) {
			const { data, error } = await event.locals.supabase
				.from('profiles')
				.select('*, department:departments(*), program:programs(*)')
				.eq('id', user.id)
				.maybeSingle();

			if (error) {
				if (databaseMissing(error)) event.locals.setupRequired = true;
			} else {
				event.locals.profile = (data as Profile) ?? null;
			}
		}
	} catch {
		event.locals.setupRequired = true;
	}

	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; frame-ancestors 'none';"
	);

	return response;
};
