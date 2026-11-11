import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Department, Note, Program, Subject, Topic } from '$lib/types';
import { NOTE_CARD_SELECT, savedNoteIds, savedTopicIds } from '$lib/server/queries';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface SubjectDetail extends Subject {
	department?: Department | null;
	program?: Program | null;
}

interface TopicRow extends Topic {
	notes?: { count: number }[];
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!UUID.test(params.subjectId)) throw error(404, 'Course not found.');
	const supabase = locals.supabase;

	const { data: subjectData, error: subjectError } = await supabase
		.from('subjects')
		.select('*, department:departments(*), program:programs(*)')
		.eq('id', params.subjectId)
		.maybeSingle();

	if (subjectError || !subjectData) throw error(404, 'That course does not exist in the community catalog.');
	const subject = subjectData as unknown as SubjectDetail;

	const sort = url.searchParams.get('sort') ?? 'newest';
	const topicParam = url.searchParams.get('topic') ?? '';
	const topic = UUID.test(topicParam) ? topicParam : '';

	let notesQuery = supabase.from('notes').select(NOTE_CARD_SELECT).eq('subject_id', subject.id);
	if (topic) notesQuery = notesQuery.eq('topic_id', topic);
	notesQuery =
		sort === 'popular'
			? notesQuery.order('downloads', { ascending: false })
			: notesQuery.order('created_at', { ascending: false });

	const [notesResult, topicResult, siblingsResult] = await Promise.all([
		notesQuery.limit(24),
		supabase.from('topics').select('*, notes(count)').eq('subject_id', subject.id).order('name'),
		supabase
			.from('subjects')
			.select('id, code, name, year_level, semester')
			.eq('department_id', subject.department_id)
			.neq('id', subject.id)
			.order('code')
			.limit(8)
	]);

	const notes = (notesResult.data ?? []) as unknown as Note[];
	const topics = (topicResult.data ?? []) as unknown as TopicRow[];
	const [savedIds, topicIds] = await Promise.all([
		savedNoteIds(supabase, locals.user!.id, notes.map((note) => note.id)),
		savedTopicIds(supabase, locals.user!.id, topics.map((item) => item.id))
	]);

	return {
		subject,
		notes,
		topics,
		savedIds: [...savedIds],
		topicIds: [...topicIds],
		siblings: (siblingsResult.data ?? []) as Subject[],
		filters: { sort, topic },
		verifiedCount: notes.filter((note) => note.status === 'verified').length,
		profile: locals.profile
	};
};
