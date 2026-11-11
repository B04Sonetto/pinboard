import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note, Profile, Suggestion } from '$lib/types';
import { NOTE_CARD_SELECT } from '$lib/server/queries';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';

const AVATAR_COLORS = ['#FFD34D', '#A9E5BF', '#BCDCFF', '#FFC3D2', '#DCD0FF', '#FF9C88', '#C9A276'];
const DEFAULT_COLOR = AVATAR_COLORS[0];

export const load: PageServerLoad = async ({ locals }) => {
	const profile = locals.profile as Profile;
	const userId = locals.user!.id;

	const [notesResult, notesStatusResult, bookmarkResult, topicBookmarkResult, attemptResult, generationResult, suggestionResult, departmentResult, programResult] =
		await Promise.all([
			locals.supabase.from('notes').select(NOTE_CARD_SELECT).eq('author_id', userId).order('created_at', { ascending: false }).limit(60),
			locals.supabase.from('notes').select('status').eq('author_id', userId),
			locals.supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
			locals.supabase.from('topic_bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
			locals.supabase.from('quiz_attempts').select('score, total').eq('user_id', userId).limit(500),
			locals.supabase.from('ai_generations').select('*', { count: 'exact', head: true }).eq('user_id', userId),
			locals.supabase
				.from('suggestions')
				.select('id, kind, title, status, created_at, admin_note')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(6),
			locals.supabase.from('departments').select('id, name, short_name, color').order('sort_order'),
			locals.supabase.from('programs').select('id, name, code, department_id').order('name')
		]);

	const notes = (notesResult.data ?? []) as unknown as Note[];
	const statusRows = (notesStatusResult.error ? notes : (notesStatusResult.data ?? [])) as {
		status: string;
	}[];
	const statusCounts = statusRows.reduce<Record<string, number>>((map, row) => {
		map[row.status] = (map[row.status] ?? 0) + 1;
		return map;
	}, {});
	const attempts = (attemptResult.data ?? []) as { score: number; total: number }[];
	const best = attempts.reduce((max, attempt) => Math.max(max, attempt.total ? attempt.score / attempt.total : 0), 0);
	const average = attempts.length
		? attempts.reduce((sum, attempt) => sum + (attempt.total ? attempt.score / attempt.total : 0), 0) / attempts.length
		: 0;

	return {
		profile,
		user: locals.user,
		notes,
		suggestions: (suggestionResult.data ?? []) as unknown as Pick<
			Suggestion,
			'id' | 'kind' | 'title' | 'status' | 'created_at' | 'admin_note'
		>[],
		departments: (departmentResult.data ?? []) as { id: string; name: string; short_name: string; color: string }[],
		programs: (programResult.data ?? []) as { id: string; name: string; code: string; department_id: string }[],
		avatarColors: AVATAR_COLORS,
		deleteConfigured: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
		stats: {
			notes: statusRows.length,
			verified: statusCounts.verified ?? 0,
			submitted: statusCounts.submitted ?? 0,
			rejected: statusCounts.rejected ?? 0,
			saved: bookmarkResult.count ?? 0,
			savedTopics: topicBookmarkResult.count ?? 0,
			attempts: attempts.length,
			generations: generationResult.count ?? 0,
			bestPercent: Math.round(best * 100),
			averagePercent: Math.round(average * 100)
		}
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		const form = await request.formData();
		const fullName = String(form.get('full_name') ?? '').trim();
		const bio = String(form.get('bio') ?? '').trim();
		const departmentId = String(form.get('department_id') ?? '').trim();
		const programId = String(form.get('program_id') ?? '').trim();
		const yearLevel = Number(form.get('year_level') ?? 0);
		const semester = Number(form.get('semester') ?? 0);
		const rawColor = String(form.get('avatar_color') ?? '').trim().toUpperCase();
		const avatarColor = /^#[0-9A-F]{6}$/.test(rawColor) ? rawColor : DEFAULT_COLOR;

		const errors: Record<string, string> = {};
		if (fullName.length < 2) errors.full_name = 'Enter your full name.';
		if (fullName.length > 80) errors.full_name = 'Keep your name under 80 characters.';
		if (bio.length > 500) errors.bio = 'Keep your bio under 500 characters.';
		if (yearLevel && (yearLevel < 1 || yearLevel > 6)) errors.year_level = 'Year level must be between 1 and 6.';
		if (semester && (semester < 1 || semester > 2)) errors.semester = 'Choose 1st or 2nd semester.';

		if (programId) {
			if (!departmentId) {
				errors.program_id = 'Choose a department before selecting a program.';
			} else {
				const { data: program } = await locals.supabase
					.from('programs')
					.select('id, department_id')
					.eq('id', programId)
					.maybeSingle();
				if (!program || program.department_id !== departmentId) {
					errors.program_id = 'Choose a program that belongs to your department.';
				}
			}
		}

		if (Object.keys(errors).length) {
			return fail(400, { error: 'Please fix the highlighted fields.', errors });
		}

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				full_name: fullName,
				bio: bio || null,
				department_id: departmentId || null,
				program_id: programId || null,
				year_level: yearLevel || null,
				semester: semester || null,
				avatar_color: avatarColor
			})
			.eq('id', locals.user!.id);

		if (error) return fail(400, { error: 'Could not save your profile. Try again in a moment.' });

		return { success: true, message: 'Profile updated.' };
	},

	changePassword: async ({ request, locals }) => {
		const form = await request.formData();
		const currentPassword = String(form.get('current_password') ?? '');
		const password = String(form.get('new_password') ?? '');
		const confirm = String(form.get('confirm_password') ?? '');

		if (!currentPassword) {
			return fail(400, { passwordError: 'Enter your current password first.' });
		}
		if (password.length < 8) {
			return fail(400, { passwordError: 'Password must be at least 8 characters long.' });
		}
		if (password !== confirm) {
			return fail(400, { passwordError: 'Passwords do not match.' });
		}

		const email = locals.user!.email;
		if (!email) return fail(400, { passwordError: 'This account has no email address to verify.' });

		const { error: verifyError } = await locals.supabase.auth.signInWithPassword({
			email,
			password: currentPassword
		});
		if (verifyError) {
			return fail(400, { passwordError: 'Your current password is incorrect.' });
		}

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			return fail(400, { passwordError: error.message || 'Could not update password.' });
		}

		return { passwordSuccess: true, passwordMessage: 'Password updated successfully.' };
	},

	exportData: async ({ locals }) => {
		const userId = locals.user!.id;
		const [notes, bookmarks, topicBookmarks, attempts, generations, suggestions, profile] = await Promise.all([
			locals.supabase
				.from('notes')
				.select('id, title, summary, content, visibility, status, created_at, updated_at, keywords, source_url')
				.eq('author_id', userId),
			locals.supabase.from('bookmarks').select('note_id, created_at').eq('user_id', userId),
			locals.supabase.from('topic_bookmarks').select('topic_id, created_at').eq('user_id', userId),
			locals.supabase
				.from('quiz_attempts')
				.select('generation_id, score, total, answers, created_at')
				.eq('user_id', userId),
			locals.supabase
				.from('ai_generations')
				.select('id, kind, title, content, payload, source_note_ids, created_at')
				.eq('user_id', userId),
			locals.supabase
				.from('suggestions')
				.select('kind, title, details, status, admin_note, created_at')
				.eq('user_id', userId),
			locals.supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
		]);

		const exportPayload = {
			exported_at: new Date().toISOString(),
			user_id: userId,
			email: locals.user!.email,
			profile: profile.data,
			notes: notes.data ?? [],
			bookmarks: bookmarks.data ?? [],
			topic_bookmarks: topicBookmarks.data ?? [],
			study_generations: generations.data ?? [],
			quiz_attempts: attempts.data ?? [],
			suggestions: suggestions.data ?? []
		};

		return {
			exportSuccess: true,
			exportJson: JSON.stringify(exportPayload, null, 2)
		};
	},

	deleteAccount: async ({ request, locals }) => {
		const form = await request.formData();
		const confirmation = String(form.get('confirmation') ?? '').trim();

		if (confirmation !== 'DELETE') {
			return fail(400, { deleteError: 'Type DELETE to confirm account deletion.' });
		}

		const userId = locals.user!.id;

		let serviceKey: string | undefined;
		try {
			const env = await import('$env/dynamic/private');
			serviceKey = env.env.SUPABASE_SERVICE_ROLE_KEY;
		} catch {
			// Missing server environment configuration is reported below.
		}

		if (!serviceKey) {
			return fail(503, {
				deleteError: 'Account deletion is not configured. Contact an administrator to complete deletion safely.'
			});
		}

		try {
			const { createClient } = await import('@supabase/supabase-js');
			const adminClient = createClient(PUBLIC_SUPABASE_URL, serviceKey);
			const { error: deletionError } = await adminClient.auth.admin.deleteUser(userId);
			if (deletionError) {
				console.error('Account deletion error:', deletionError.message);
				return fail(400, { deleteError: 'Could not delete your account. Please try again or contact an administrator.' });
			}
		} catch (err) {
			console.error('Account deletion error:', err);
			return fail(500, { deleteError: 'Could not delete your account. Please try again or contact an administrator.' });
		}

		await locals.supabase.auth.signOut();
		redirect(303, '/login?notice=account_deleted');
	}
};
