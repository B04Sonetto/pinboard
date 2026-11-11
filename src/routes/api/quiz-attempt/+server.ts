import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Sign in to save quiz results.' }, { status: 401 });

	let body: { generationId?: string; answers?: Record<string, number> };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const generationId = body.generationId ?? '';
	if (!UUID.test(generationId)) return json({ error: 'Unknown quiz.' }, { status: 400 });
	if (!body.answers || typeof body.answers !== 'object') {
		return json({ error: 'Answers are missing.' }, { status: 400 });
	}

	const { data: generation, error: generationError } = await locals.supabase
		.from('ai_generations')
		.select('id, kind, payload')
		.eq('id', generationId)
		.eq('user_id', locals.user.id)
		.maybeSingle();

	if (generationError || !generation) return json({ error: 'Quiz not found.' }, { status: 404 });
	if (generation.kind !== 'quiz') return json({ error: 'This generation is not a quiz.' }, { status: 400 });

	const questions = (generation.payload?.questions ?? []) as {
		id: string;
		answer: number;
		options: string[];
		explanation: string;
	}[];

	if (!Array.isArray(questions) || questions.length === 0) {
		return json({ error: 'This quiz has no questions.' }, { status: 400 });
	}

	let score = 0;
	const results = questions.map((question) => {
		const chosen = body.answers?.[question.id];
		const correct = chosen === question.answer;
		if (correct) score += 1;
		return {
			id: question.id,
			chosen: typeof chosen === 'number' ? chosen : -1,
			answer: question.answer,
			correct,
			explanation: question.explanation,
			options: question.options
		};
	});

	const { error: insertError } = await locals.supabase.from('quiz_attempts').insert({
		user_id: locals.user.id,
		generation_id: generationId,
		score,
		total: questions.length,
		answers: body.answers
	});

	if (insertError) {
		throw error(400, 'Could not save your quiz attempt. Try again.');
	}

	return json({ score, total: questions.length, results });
};
