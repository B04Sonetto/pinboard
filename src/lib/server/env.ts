import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';

export interface AppEnv {
	PUBLIC_SUPABASE_URL: string;
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
}

export function validateEnv(): AppEnv {
	const errors: string[] = [];

	if (!PUBLIC_SUPABASE_URL) {
		errors.push('PUBLIC_SUPABASE_URL is required');
	} else {
		try {
			new URL(PUBLIC_SUPABASE_URL);
		} catch {
			errors.push('PUBLIC_SUPABASE_URL must be a valid URL');
		}
	}

	if (!PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
		errors.push('PUBLIC_SUPABASE_PUBLISHABLE_KEY is required');
	}

	if (errors.length > 0) {
		throw new Error(`Environment validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`);
	}

	return {
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY
	};
}
