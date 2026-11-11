import type { PageServerLoad } from './$types';
import type { Department, Note, Subject, Topic } from '$lib/types';
import { NOTE_CARD_SELECT, savedNoteIds } from '$lib/server/queries';

interface TopicWithSubject extends Topic {
	subject?: (Subject & { department?: Department | null }) | null;
}

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { counts, recentActivity } = await parent();
	const profile = locals.profile!;
	const supabase = locals.supabase;

	const [fresh, trending, bookmarkRows, attempts, topics, available] = await Promise.all([
		supabase
			.from('notes')
			.select(NOTE_CARD_SELECT)
			.eq('status', 'verified')
			.order('created_at', { ascending: false })
			.limit(6),
		supabase
			.from('notes')
			.select(NOTE_CARD_SELECT)
			.eq('status', 'verified')
			.order('downloads', { ascending: false })
			.limit(4),
		supabase
			.from('bookmarks')
			.select('note_id, created_at')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(4),
		supabase
			.from('quiz_attempts')
			.select('id, score, total, created_at, generation:ai_generations!quiz_attempts_generation_id_fkey(id, title, kind)')
			.eq('user_id', locals.user!.id)
			.order('created_at', { ascending: false })
			.limit(3),
		supabase
			.from('topics')
			.select('*, subject:subjects(*, department:departments(*))')
			.order('name')
			.limit(80),
		supabase.from('notes').select('*', { count: 'exact', head: true }).eq('status', 'verified')
	]);

	const freshNotes = (fresh.data ?? []) as unknown as Note[];

	const bookmarkIds = (bookmarkRows.data ?? []).map((row) => row.note_id as string);
	let savedNotes: Note[] = [];
	if (bookmarkIds.length > 0) {
		const { data } = await supabase.from('notes').select(NOTE_CARD_SELECT).in('id', bookmarkIds);
		const byId = new Map(((data ?? []) as unknown as Note[]).map((note) => [note.id, note]));
		savedNotes = bookmarkIds.map((id) => byId.get(id)).filter((note): note is Note => Boolean(note));
	}

	const savedIds = await savedNoteIds(supabase, locals.user!.id, [
		...freshNotes.map((note) => note.id),
		...savedNotes.map((note) => note.id)
	]);

	const allTopics = (topics.data ?? []) as unknown as TopicWithSubject[];
	const topicPicks = allTopics
		.filter((topic) => topic.subject?.department_id === profile.department_id)
		.slice(0, 5);
	const fallbackTopics = allTopics.filter((topic) => !topicPicks.includes(topic)).slice(0, 5);

	return {
		counts,
		recentActivity,
		freshNotes,
		savedIds: [...savedIds],
		trending: (trending.data ?? []) as unknown as Note[],
		savedNotes,
		attempts: (attempts.data ?? []) as unknown as {
			id: string;
			score: number;
			total: number;
			created_at: string;
			generation: { id: string; title: string; kind: string } | null;
		}[],
		suggestedTopics: (topicPicks.length ? topicPicks : fallbackTopics).slice(0, 5),
		available: available.count ?? 0,
		notice: url.searchParams.get('notice')
	};
};
