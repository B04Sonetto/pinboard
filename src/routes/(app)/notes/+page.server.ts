import type { PageServerLoad } from './$types';
import type { Note } from '$lib/types';
import { NOTE_CARD_SELECT, loadTaxonomy, savedNoteIds } from '$lib/server/queries';

const PAGE_SIZE = 12;

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const profile = locals.profile!;
	const q = (url.searchParams.get('q') ?? '').trim();
	const department = url.searchParams.get('department') ?? '';
	const subject = url.searchParams.get('subject') ?? '';
	const topic = url.searchParams.get('topic') ?? '';
	const status = url.searchParams.get('status') ?? 'all';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const mine = url.searchParams.get('mine') === '1';
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

	const taxonomy = await loadTaxonomy(supabase);

	let query = supabase.from('notes').select(NOTE_CARD_SELECT, { count: 'exact' });

	if (q) query = query.textSearch('search_vector', q, { type: 'websearch' });
	if (department) query = query.eq('department_id', department);
	if (subject) query = query.eq('subject_id', subject);
	if (topic) query = query.eq('topic_id', topic);
	if (status === 'verified' || status === 'submitted' || status === 'rejected') query = query.eq('status', status);
	if (mine) query = query.eq('author_id', locals.user!.id);

	switch (sort) {
		case 'oldest':
			query = query.order('created_at', { ascending: true });
			break;
		case 'popular':
			query = query.order('downloads', { ascending: false });
			break;
		default:
			query = query.order('created_at', { ascending: false });
	}

	const from = (page - 1) * PAGE_SIZE;
	const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

	const notes = (data ?? []) as unknown as Note[];
	const savedIds = await savedNoteIds(supabase, locals.user!.id, notes.map((note) => note.id));

	return {
		notes,
		total: count ?? 0,
		page,
		pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
		savedIds: [...savedIds],
		taxonomy,
		filters: { q, department, subject, topic, status, sort, mine },
		canModerate: profile.role === 'moderator' || profile.role === 'admin',
		error: error && !/row-level|permission/i.test(error.message) ? error.message : null
	};
};
