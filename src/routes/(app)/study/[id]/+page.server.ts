import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Note, StudyGeneration, StudyPayload } from '$lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) throw error(404, 'Study material not found.');
	const supabase = locals.supabase;

	const { data, error: generationError } = await supabase
		.from('ai_generations')
		.select('*, subject:subjects(*), topic:topics(*)')
		.eq('id', params.id)
		.eq('user_id', locals.user!.id)
		.maybeSingle();

	if (generationError || !data) throw error(404, 'That study material was not found.');

	const generation = data as unknown as StudyGeneration;
	const payload = (generation.payload ?? {}) as StudyPayload;
	const noteIds = generation.source_note_ids ?? [];

	const [sourceResult, attemptsResult] = await Promise.all([
		noteIds.length
			? supabase.from('notes').select('id, title, status, origin, subject_id, topic_id').in('id', noteIds)
			: Promise.resolve({ data: [], error: null }),
		supabase
			.from('quiz_attempts')
			.select('id, score, total, created_at')
			.eq('generation_id', generation.id)
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(10)
	]);

	const sourceMap = new Map(
		((sourceResult.data ?? []) as unknown as Pick<Note, 'id' | 'title' | 'status' | 'origin' | 'subject_id' | 'topic_id'>[]).map(
			(note) => [note.id, note]
		)
	);
	const sources = noteIds
		.map((id) => sourceMap.get(id))
		.filter((note): note is Pick<Note, 'id' | 'title' | 'status' | 'origin' | 'subject_id' | 'topic_id'> => Boolean(note));

	const attempts = (attemptsResult.data ?? []) as { id: string; score: number; total: number; created_at: string }[];
	const best = attempts.reduce((max, attempt) => Math.max(max, attempt.total ? attempt.score / attempt.total : 0), 0);

	return {
		generation,
		payload,
		sources,
		attempts,
		bestPercent: Math.round(best * 100),
		questionCount: payload.questions?.length ?? 0,
		identificationCount: payload.identification?.length ?? 0
	};
};

export const actions: Actions = {
	delete: async ({ params, locals }) => {
		const { error: deleteError } = await locals.supabase
			.from('ai_generations')
			.delete()
			.eq('id', params.id)
			.eq('user_id', locals.user!.id);
		if (deleteError) return fail(400, { error: 'Could not delete this generation.' });
		redirect(303, '/study/history');
	}
};
