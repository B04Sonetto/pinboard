import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note, Profile, Suggestion } from '$lib/types';
import { NOTE_CARD_SELECT } from '$lib/server/queries';

const AVATAR_COLORS = ['#FFD34D', '#A9E5BF', '#BCDCFF', '#FFC3D2', '#DCD0FF', '#FF9C88', '#C9A276'];
const DEFAULT_COLOR = AVATAR_COLORS[0];

export const load: PageServerLoad = async ({ locals }) => {
	const profile = locals.profile as Profile;
	const userId = locals.user!.id;

	const [notesResult, bookmarkResult, topicBookmarkResult, attemptResult, generationResult, suggestionResult, departmentResult, programResult] =
		await Promise.all([
			locals.supabase.from('notes').select(NOTE_CARD_SELECT).eq('author_id', userId).order('created_at', { ascending: false }).limit(60),
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
	const statusCounts = notes.reduce<Record<string, number>>((map, note) => {
		map[note.status] = (map[note.status] ?? 0) + 1;
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
		stats: {
			notes: notes.length,
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
	}
};
