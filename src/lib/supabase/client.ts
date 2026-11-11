import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowserClient() {
	return createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

/** Shared browser client — safe to call from any component after mount. */
export function getSupabaseBrowserClient() {
	if (!browserClient) browserClient = createSupabaseBrowserClient();
	return browserClient;
}
