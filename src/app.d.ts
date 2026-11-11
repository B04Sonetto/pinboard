import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Profile } from '$lib/types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			user: User | null;
			profile: Profile | null;
			setupRequired: boolean;
		}

		interface PageData {
			user: User | null;
			profile: Profile | null;
		}

		interface PageState {
			noteId?: string;
		}

		interface Platform {
			env?: Record<string, string>;
		}
	}
}

export {};
