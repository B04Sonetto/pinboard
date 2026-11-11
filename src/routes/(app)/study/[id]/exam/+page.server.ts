import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { EssayPrompt, IdentificationQuestion, QuizQuestion, StudyGeneration } from '$lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) throw error(404, 'Exam not found.');

	const { data, error: generationError } = await locals.supabase
		.from('ai_generations')
		.select('id, kind, title, payload, created_at, subject_id, topic_id, subject:subjects(id, code, name), topic:topics(id, name)')
		.eq('id', params.id)
		.eq('user_id', locals.user!.id)
		.maybeSingle();

	if (generationError || !data) throw error(404, 'That exam was not found.');
	if (data.kind !== 'exam') throw error(404, 'This generation is not a practice exam.');

	const generation = data as unknown as StudyGeneration;
	const payload = generation.payload ?? {};
	const questions = (payload.questions ?? []).map((question: QuizQuestion) => ({
		id: question.id,
		prompt: question.prompt,
		options: question.options,
		sourceNoteId: question.sourceNoteId,
		sourceTitle: question.sourceTitle
	}));
	const identification = (payload.identification ?? []).map((question: IdentificationQuestion) => ({
		id: question.id,
		prompt: question.prompt,
		sourceNoteId: question.sourceNoteId,
		sourceTitle: question.sourceTitle
	}));
	const essays = (payload.essays ?? []) as EssayPrompt[];

	const { data: attempts } = await locals.supabase
		.from('quiz_attempts')
		.select('id, score, total, created_at')
		.eq('generation_id', generation.id)
		.eq('user_id', locals.user!.id)
		.order('created_at', { ascending: false })
		.limit(5);

	return {
		exam: {
			id: generation.id,
			title: generation.title,
			createdAt: generation.created_at,
			subject: generation.subject,
			topic: generation.topic,
			config: payload.exam ?? { timeLimitMinutes: 45, sections: ['multiple_choice'] },
			questions,
			identification,
			essays
		},
		previousAttempts: (attempts ?? []) as { id: string; score: number; total: number; created_at: string }[]
	};
};
