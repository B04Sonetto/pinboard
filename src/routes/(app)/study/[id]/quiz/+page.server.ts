import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { IdentificationQuestion, QuizQuestion, StudyGeneration } from '$lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) throw error(404, 'Quiz not found.');

	const { data, error: generationError } = await locals.supabase
		.from('ai_generations')
		.select('id, kind, title, payload, subject_id, topic_id, created_at, subject:subjects(id, code, name), topic:topics(id, name)')
		.eq('id', params.id)
		.eq('user_id', locals.user!.id)
		.maybeSingle();

	if (generationError || !data) throw error(404, 'That quiz was not found.');
	if (data.kind !== 'quiz') throw error(404, 'This generation is not a practice quiz.');

	const generation = data as unknown as StudyGeneration;
	const questions = (generation.payload?.questions ?? []) as QuizQuestion[];
	const identification = (generation.payload?.identification ?? []) as IdentificationQuestion[];
	if (!questions.length && !identification.length) throw error(404, 'This quiz has no questions. Generate a new one.');

	// Keep the answer key on the server; the client receives only prompts and options.
	const clientQuestions = questions.map((question) => ({
		id: question.id,
		prompt: question.prompt,
		options: question.options,
		sourceNoteId: question.sourceNoteId,
		sourceTitle: question.sourceTitle
	}));
	const clientIdentification = identification.map((question) => ({
		id: question.id,
		prompt: question.prompt,
		sourceNoteId: question.sourceNoteId,
		sourceTitle: question.sourceTitle
	}));

	const { data: attempts } = await locals.supabase
		.from('quiz_attempts')
		.select('id, score, total, created_at')
		.eq('generation_id', generation.id)
		.eq('user_id', locals.user!.id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		quiz: {
			...generation,
			payload: {
				...generation.payload,
				questions: clientQuestions,
				identification: clientIdentification
			}
		},
		previousAttempts: (attempts ?? []) as { id: string; score: number; total: number; created_at: string }[]
	};
};
