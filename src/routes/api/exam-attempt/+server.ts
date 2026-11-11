import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { IdentificationQuestion, QuizQuestion } from '$lib/types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeAnswer(value: unknown): string {
	return String(value ?? '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Sign in to save exam results.' }, { status: 401 });

	let body: {
		generationId?: string;
		answers?: {
			objective?: Record<string, number>;
			identification?: Record<string, string>;
			essays?: Record<string, string>;
		};
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body.' }, { status: 400 });
	}

	const generationId = body.generationId ?? '';
	if (!UUID.test(generationId)) return json({ error: 'Unknown exam.' }, { status: 400 });
	if (!body.answers || typeof body.answers !== 'object') {
		return json({ error: 'Exam answers are missing.' }, { status: 400 });
	}

	const { data: generation, error: generationError } = await locals.supabase
		.from('ai_generations')
		.select('id, kind, payload')
		.eq('id', generationId)
		.eq('user_id', locals.user.id)
		.maybeSingle();

	if (generationError || !generation) return json({ error: 'Exam not found.' }, { status: 404 });
	if (generation.kind !== 'exam') return json({ error: 'This generation is not an exam.' }, { status: 400 });

	const payload = (generation.payload ?? {}) as {
		questions?: QuizQuestion[];
		identification?: IdentificationQuestion[];
	};
	const questions = Array.isArray(payload.questions) ? payload.questions : [];
	const identification = Array.isArray(payload.identification) ? payload.identification : [];
	const objectiveAnswers = body.answers.objective ?? {};
	const identificationAnswers = body.answers.identification ?? {};

	let score = 0;
	const results = questions.map((question) => {
		const chosen = objectiveAnswers[question.id];
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

	const identificationResults = identification.map((question) => {
		const chosen = String(identificationAnswers[question.id] ?? '');
		const correct = normalizeAnswer(chosen) === normalizeAnswer(question.answer);
		if (correct) score += 1;
		return {
			id: question.id,
			chosen,
			answer: question.answer,
			correct,
			explanation: question.explanation
		};
	});

	const total = questions.length + identification.length;
	const { error: insertError } = await locals.supabase.from('quiz_attempts').insert({
		user_id: locals.user.id,
		generation_id: generationId,
		score,
		total,
		answers: body.answers
	});

	if (insertError) {
		throw error(400, 'Could not save your exam attempt. Try again.');
	}

	return json({
		score,
		total,
		objectiveTotal: questions.length,
		identificationTotal: identification.length,
		essayCount: Object.keys(body.answers.essays ?? {}).length,
		results,
		identificationResults
	});
};
