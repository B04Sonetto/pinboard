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

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
