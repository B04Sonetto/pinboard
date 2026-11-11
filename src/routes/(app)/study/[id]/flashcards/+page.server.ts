import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Flashcard, StudyGeneration } from '$lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) throw error(404, 'Flashcard set not found.');

	const { data, error: generationError } = await locals.supabase
		.from('ai_generations')
		.select('id, kind, title, payload, created_at, subject:subjects(id, code, name), topic:topics(id, name)')
		.eq('id', params.id)
		.eq('user_id', locals.user!.id)
		.maybeSingle();

	if (generationError || !data) throw error(404, 'That study material was not found.');

	const generation = data as unknown as StudyGeneration;
	if (generation.kind !== 'quiz') throw error(404, 'Flashcards are generated alongside practice quizzes.');

	const cards = (generation.payload?.flashcards ?? []) as Flashcard[];
	if (!cards.length) throw error(404, 'This quiz has no flashcards. Generate a new quiz to get a card set.');

	return {
		generation,
		cards
	};
};
