import type { PageServerLoad } from './$types';
import type { Note } from '$lib/types';
import { NOTE_CARD_SELECT, loadTaxonomy, savedNoteIds } from '$lib/server/queries';

const PAGE_SIZE = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const profile = locals.profile!;
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
	const fallbackTerm = q
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 80);
	const department = url.searchParams.get('department') ?? '';
	const program = url.searchParams.get('program') ?? '';
	const subject = url.searchParams.get('subject') ?? '';
	const topic = url.searchParams.get('topic') ?? '';
	const yearLevel = url.searchParams.get('year_level') ?? '';
	const semester = url.searchParams.get('semester') ?? '';
	const visibility = url.searchParams.get('visibility') ?? 'all';
	const status = url.searchParams.get('status') ?? 'all';
	const sort = url.searchParams.get('sort') ?? 'newest';
	const mine = url.searchParams.get('mine') === '1';
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

	const taxonomy = await loadTaxonomy(supabase);

	function applyFilters<T>(baseQuery: T): T {
		let qry: any = baseQuery;
		if (department) qry = qry.eq('department_id', department);
		if (program && UUID.test(program)) qry = qry.eq('program_id', program);
		if (subject && UUID.test(subject)) qry = qry.eq('subject_id', subject);
		if (topic && UUID.test(topic)) qry = qry.eq('topic_id', topic);
		const yearFilter = Number.parseInt(yearLevel, 10);
		const semesterFilter = Number.parseInt(semester, 10);
		if (Number.isInteger(yearFilter) && yearFilter >= 1 && yearFilter <= 6) {
			qry = qry.eq('year_level', yearFilter);
		}
		if (semesterFilter === 1 || semesterFilter === 2) {
			qry = qry.eq('semester', semesterFilter);
		}
		if (visibility === 'community' || visibility === 'department') qry = qry.eq('visibility', visibility);
		if (status === 'verified' || status === 'submitted' || status === 'rejected') qry = qry.eq('status', status);
		if (mine) qry = qry.eq('author_id', locals.user!.id);

		switch (sort) {
			case 'oldest':
				qry = qry.order('created_at', { ascending: true });
				break;
			case 'popular':
				qry = qry.order('downloads', { ascending: false });
				break;
			default:
				qry = qry.order('created_at', { ascending: false });
		}
		return qry;
	}

	let query = applyFilters(supabase.from('notes').select(NOTE_CARD_SELECT, { count: 'exact' }));
	if (q) query = query.textSearch('search_vector', q, { type: 'websearch' });

	const from = (page - 1) * PAGE_SIZE;
	let { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
	let isFallback = false;

	// Typo-tolerant fallback: if full-text search yields 0 results, fall back to ilike wildcard search
	if ((count ?? 0) === 0 && fallbackTerm) {
		const fallbackQuery = applyFilters(
			supabase
				.from('notes')
				.select(NOTE_CARD_SELECT, { count: 'exact' })
				.or(`title.ilike.%${fallbackTerm}%,summary.ilike.%${fallbackTerm}%`)
		);
		const fallbackResult = await fallbackQuery.range(from, from + PAGE_SIZE - 1);
		if ((fallbackResult.count ?? 0) > 0) {
			data = fallbackResult.data;
			count = fallbackResult.count;
			isFallback = true;
		}
	}

	if (q) {
		// Search telemetry powers the admin zero-result report. Failure to log
		// must never prevent a student from seeing results.
		await supabase
			.from('search_logs')
			.insert({ user_id: locals.user!.id, query: q, result_count: count ?? 0 })
			.then(() => undefined, () => undefined);
	}

	const notes = (data ?? []) as unknown as Note[];
	const savedIds = await savedNoteIds(supabase, locals.user!.id, notes.map((note) => note.id));

	const currentDepartment = taxonomy.departments.find((d) => d.id === department) ?? null;
	const enrolledDepartment = taxonomy.departments.find((d) => d.id === profile.department_id) ?? null;

	return {
		notes,
		total: count ?? 0,
		page,
		pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
		savedIds: [...savedIds],
		taxonomy,
		currentDepartment,
		enrolledDepartment,
		isFallback,
		filters: {
			q,
			department,
			program,
			subject,
			topic,
			year_level: yearLevel,
			semester,
			visibility,
			status,
			sort,
			mine
		},
		canModerate: profile.role === 'moderator' || profile.role === 'admin',
		error: error && !/row-level|permission/i.test(error.message) ? error.message : null
	};
};
