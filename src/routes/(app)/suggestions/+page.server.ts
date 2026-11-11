import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Suggestion, SuggestionKind, Subject } from '$lib/types';

const KINDS: SuggestionKind[] = ['course', 'subject', 'lesson', 'correction', 'platform'];
const TITLE_MIN = 6;
const TITLE_MAX = 140;
const DETAILS_MAX = 4000;

export const load: PageServerLoad = async ({ locals }) => {
	const [suggestionResult, subjectResult] = await Promise.all([
		locals.supabase
			.from('suggestions')
			.select('*, subject:subjects(id, code, name)')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(80),
		locals.supabase.from('subjects').select('id, code, name, department_id').order('code')
	]);

	const suggestions = (suggestionResult.data ?? []) as unknown as Suggestion[];
	const counts = suggestions.reduce<Record<string, number>>((map, item) => {
		map[item.status] = (map[item.status] ?? 0) + 1;
		return map;
	}, {});

	return {
		suggestions,
		subjects: (subjectResult.data ?? []) as Subject[],
		counts: {
			open: counts.open ?? 0,
			under_review: counts.under_review ?? 0,
			accepted: counts.accepted ?? 0,
			declined: counts.declined ?? 0,
			total: suggestions.length
		}
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const kind = String(form.get('kind') ?? 'lesson') as SuggestionKind;
		const title = String(form.get('title') ?? '').trim();
		const details = String(form.get('details') ?? '').trim();
		const subjectId = String(form.get('subject_id') ?? '').trim();

		const errors: Record<string, string> = {};
		if (!KINDS.includes(kind)) errors.kind = 'Choose what kind of suggestion this is.';
		if (title.length < TITLE_MIN) errors.title = `Give it a clear title (at least ${TITLE_MIN} characters).`;
		if (title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;
		if (details.length < 20) errors.details = 'Add a bit more detail so a moderator can act on it.';
		if (details.length > DETAILS_MAX) errors.details = `Keep the details under ${DETAILS_MAX} characters.`;

		if (Object.keys(errors).length) {
			return fail(400, { error: 'Please fix the highlighted fields.', errors, values: { kind, title, details, subject_id: subjectId } });
		}

		const { error } = await locals.supabase.from('suggestions').insert({
			user_id: locals.user!.id,
			kind,
			title,
			details,
			subject_id: subjectId || null,
			status: 'open'
		});

		if (error) return fail(400, { error: 'Could not save your suggestion. Try again in a moment.' });

		return { success: true, message: 'Suggestion sent to the curriculum team.' };
	}
};
