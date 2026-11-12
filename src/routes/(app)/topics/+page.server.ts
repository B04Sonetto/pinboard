import type { PageServerLoad } from './$types';
import type { Department, Subject, Topic } from '$lib/types';
import { loadTaxonomy, savedTopicIds } from '$lib/server/queries';

interface TopicRow extends Topic {
	subject?: (Subject & { department?: Department | null }) | null;
	notes?: { count: number }[];
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const q = (url.searchParams.get('q') ?? '').trim();
	const department = url.searchParams.get('department') ?? '';
	const bookmarkedOnly = url.searchParams.get('saved') === '1';

	const taxonomy = await loadTaxonomy(supabase);
	const query = supabase
		.from('topics')
		.select('*, subject:subjects(*, department:departments(*)), notes(count)')
		.order('name');

	const [topicResult, bookmarks] = await Promise.all([
		query,
		savedTopicIds(supabase, locals.user!.id)
	]);

	const allTopics = (topicResult.data ?? []) as unknown as TopicRow[];
	const searchTerm = q.toLowerCase();
	let topics = searchTerm
		? allTopics.filter((topic) => {
				const subject = topic.subject;
				const departmentRow = subject?.department;
				return [
					topic.name,
					topic.description,
					subject?.code,
					subject?.name,
					departmentRow?.short_name,
					departmentRow?.name
				].some((value) => value?.toLowerCase().includes(searchTerm));
			})
		: allTopics;

	const matchedTopicCount = topics.length;
	const departmentCounts: Record<string, number> = {};
	for (const topic of topics) {
		const id = topic.subject?.department_id;
		if (id) departmentCounts[id] = (departmentCounts[id] ?? 0) + 1;
	}

	if (department) topics = topics.filter((topic) => topic.subject?.department_id === department);
	if (bookmarkedOnly) topics = topics.filter((topic) => bookmarks.has(topic.id));

	const focused = url.searchParams.get('focus');
	if (focused) {
		topics = [...topics].sort((a, b) => (a.id === focused ? -1 : b.id === focused ? 1 : 0));
	}

	return {
		topics,
		taxonomy,
		bookmarked: [...bookmarks],
		bookmarkedOnly,
		filters: { q, department },
		departmentCounts,
		matchedTopicCount,
		totalBookmarked: bookmarks.size
	};
};
