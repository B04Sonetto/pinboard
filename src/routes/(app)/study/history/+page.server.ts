import type { PageServerLoad } from './$types';
import type { StudyGeneration, StudyKind } from '$lib/types';

const KINDS: StudyKind[] = ['reviewer', 'summary', 'quiz', 'keywords'];

export const load: PageServerLoad = async ({ locals, url }) => {
	const kindParam = url.searchParams.get('kind') ?? '';
	const kind = KINDS.includes(kindParam as StudyKind) ? (kindParam as StudyKind) : '';
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);

	let generationQuery = locals.supabase
		.from('ai_generations')
		.select('*, subject:subjects(id, code, name), topic:topics(id, name)')
		.eq('user_id', locals.user!.id)
		.order('created_at', { ascending: false })
		.limit(100);

	if (kind) generationQuery = generationQuery.eq('kind', kind);
	if (q) generationQuery = generationQuery.ilike('title', `%${q}%`);

	const [generationResult, attemptResult] = await Promise.all([
		generationQuery,
		locals.supabase
			.from('quiz_attempts')
			.select('id, generation_id, score, total, created_at')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(200)
	]);

	const generations = (generationResult.data ?? []) as unknown as StudyGeneration[];
	const attempts = (attemptResult.data ?? []) as {
		id: string;
		generation_id: string;
		score: number;
		total: number;
		created_at: string;
	}[];

	const attemptsByGeneration = new Map<string, typeof attempts>();
	for (const attempt of attempts) {
		const list = attemptsByGeneration.get(attempt.generation_id) ?? [];
		list.push(attempt);
		attemptsByGeneration.set(attempt.generation_id, list);
	}

	const bestPercent = attempts.reduce(
		(max, attempt) => Math.max(max, attempt.total ? attempt.score / attempt.total : 0),
		0
	);

	const counts = KINDS.reduce<Record<string, number>>((map, item) => {
		map[item] = 0;
		return map;
	}, {});
	const { data: allKinds } = await locals.supabase
		.from('ai_generations')
		.select('kind')
		.eq('user_id', locals.user!.id);
	for (const row of (allKinds ?? []) as { kind: StudyKind }[]) {
		counts[row.kind] = (counts[row.kind] ?? 0) + 1;
	}

	return {
		generations: generations.map((generation) => ({
			...generation,
			attempts: attemptsByGeneration.get(generation.id) ?? []
		})),
		counts,
		totalGenerated: Object.values(counts).reduce((sum, value) => sum + value, 0),
		totalAttempts: attempts.length,
		bestPercent: Math.round(bestPercent * 100),
		filters: { kind, q }
	};
};
