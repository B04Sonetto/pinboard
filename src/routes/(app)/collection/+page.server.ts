import type { PageServerLoad } from './$types';
import type { Note, Topic, Subject, StudyKind } from '$lib/types';
import { NOTE_CARD_SELECT } from '$lib/server/queries';

export const load: PageServerLoad = async ({ locals, url }) => {
	const tab = url.searchParams.get('tab') === 'topics' ? 'topics' : url.searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'notes';

	const [bookmarkResult, topicResult, attemptResult, contributionResult] = await Promise.all([
		locals.supabase
			.from('bookmarks')
			.select(`note_id, created_at, note:notes!bookmarks_note_id_fkey(${NOTE_CARD_SELECT})`)
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(100),
		locals.supabase
			.from('topic_bookmarks')
			.select('topic_id, created_at, topic:topics(id, name, description, subject_id, subject:subjects(id, code, name))')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(100),
		locals.supabase
			.from('quiz_attempts')
			.select(
				'id, score, total, created_at, generation:ai_generations!quiz_attempts_generation_id_fkey(id, title, kind, subject:subjects(id, code, name), topic:topics(id, name))'
			)
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(40),
		locals.supabase
			.from('notes')
			.select(NOTE_CARD_SELECT)
			.eq('author_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(6)
	]);

	const savedNotes = ((bookmarkResult.data ?? []) as unknown as { note: Note | null }[])
		.map((row) => row.note)
		.filter((note): note is Note => Boolean(note));

	const savedTopics = (
		(topicResult.data ?? []) as unknown as {
			topic: (Topic & { subject?: Pick<Subject, 'id' | 'code' | 'name'> | null }) | null;
		}[]
	)
		.map((row) => row.topic)
		.filter((topic): topic is Topic & { subject?: Pick<Subject, 'id' | 'code' | 'name'> | null } => Boolean(topic));

	const attempts = (attemptResult.data ?? []) as unknown as {
		id: string;
		score: number;
		total: number;
		created_at: string;
		generation:
			| {
					id: string;
					title: string;
					kind: StudyKind;
					subject?: Pick<Subject, 'id' | 'code' | 'name'> | null;
					topic?: { id: string; name: string } | null;
			  }
			| null;
	}[];

	const bestPercent = attempts.reduce(
		(max, attempt) => Math.max(max, attempt.total ? attempt.score / attempt.total : 0),
		0
	);

	return {
		tab,
		savedNotes,
		savedTopics,
		attempts: attempts.filter((attempt) => attempt.generation),
		contributions: (contributionResult.data ?? []) as unknown as Note[],
		counts: {
			notes: savedNotes.length,
			topics: savedTopics.length,
			attempts: attempts.length
		},
		bestPercent: Math.round(bestPercent * 100)
	};
};
