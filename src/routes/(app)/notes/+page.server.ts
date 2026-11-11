import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { BoardTab, Department, Note } from '$lib/types';
import { NOTE_CARD_SELECT, loadTaxonomy, savedNoteIds } from '$lib/server/queries';
import { readPinnedBoardIds, writePinnedBoardIds } from '$lib/server/boards';
import { DEFAULT_NOTE_COLOR } from '$lib/utils';

const PAGE_SIZE = 12;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ locals, url, cookies }) => {
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
	const departments = taxonomy.departments;
	const enrolledDepartment = departments.find((d) => d.id === profile.department_id) ?? null;
	const currentDepartment = departments.find((d) => d.id === department) ?? null;

	/**
	 * Which board is the student looking at?
	 *  - community: notes shared with everyone
	 *  - own:       everything from the enrolled department, incl. department-only
	 *  - other:     only what another department shared with the whole community
	 */
	const board: 'community' | 'own' | 'other' = !currentDepartment
		? 'community'
		: currentDepartment.id === enrolledDepartment?.id
			? 'own'
			: 'other';

	function applyFilters<T>(baseQuery: T): T {
		let qry: any = baseQuery;
		if (currentDepartment) qry = qry.eq('department_id', currentDepartment.id);
		// Department-only notes are only ever listed on the enrolled department's board.
		// "Only mine" is the exception so authors can always find their own work.
		if (board !== 'own' && !mine) qry = qry.eq('visibility', 'community');
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

	// ── Board tabs (with unfiltered counts) ────────────────────────────────
	const pinnedIds = readPinnedBoardIds(cookies).filter(
		(id) => id !== enrolledDepartment?.id && departments.some((d) => d.id === id)
	);
	const otherTabDepartments: { dept: Department; kind: 'pinned' | 'temporary' }[] = pinnedIds
		.map((id) => departments.find((d) => d.id === id)!)
		.map((dept) => ({ dept, kind: 'pinned' as const }));

	// Linked here from elsewhere (dashboard, a note page…) without having pinned it:
	// show it as a temporary tab so the student always sees where they are.
	if (board === 'other' && currentDepartment && !pinnedIds.includes(currentDepartment.id)) {
		otherTabDepartments.push({ dept: currentDepartment, kind: 'temporary' });
	}

	const countOf = async (scope: { department?: string; communityOnly?: boolean }) => {
		let qry = supabase.from('notes').select('*', { count: 'exact', head: true });
		if (scope.department) qry = qry.eq('department_id', scope.department);
		if (scope.communityOnly) qry = qry.eq('visibility', 'community');
		const { count } = await qry;
		return count ?? 0;
	};

	const [communityCount, ownCount, otherCounts] = await Promise.all([
		countOf({ communityOnly: true }),
		enrolledDepartment ? countOf({ department: enrolledDepartment.id }) : Promise.resolve(0),
		Promise.all(otherTabDepartments.map(({ dept }) => countOf({ department: dept.id, communityOnly: true })))
	]);

	const boards: BoardTab[] = [
		{
			key: 'community',
			label: 'Community',
			title: 'Community',
			color: '#FFF9EA',
			count: communityCount,
			kind: 'community',
			href: '/notes',
			departmentId: null
		}
	];
	if (enrolledDepartment) {
		boards.push({
			key: enrolledDepartment.id,
			label: enrolledDepartment.short_name,
			title: enrolledDepartment.name,
			color: enrolledDepartment.color || DEFAULT_NOTE_COLOR,
			count: ownCount,
			kind: 'own',
			href: `/notes?department=${enrolledDepartment.id}`,
			departmentId: enrolledDepartment.id
		});
	}
	otherTabDepartments.forEach(({ dept, kind }, index) => {
		boards.push({
			key: dept.id,
			label: dept.short_name,
			title: dept.name,
			color: dept.color || DEFAULT_NOTE_COLOR,
			count: otherCounts[index],
			kind,
			href: `/notes?department=${dept.id}`,
			departmentId: dept.id
		});
	});

	const tabbedIds = new Set(boards.map((tab) => tab.departmentId).filter(Boolean));
	const availableDepartments = departments.filter((d) => !tabbedIds.has(d.id));

	// ── Notes for the current board ────────────────────────────────────────
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

	return {
		notes,
		total: count ?? 0,
		page,
		pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
		savedIds: [...savedIds],
		taxonomy,
		boards,
		board,
		availableDepartments,
		currentDepartment,
		enrolledDepartment,
		isFallback,
		filters: {
			q,
			department: currentDepartment?.id ?? '',
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

export const actions: Actions = {
	/** Follow another department's board (the "+" tab). */
	pin: async ({ request, cookies, locals }) => {
		const departmentId = String((await request.formData()).get('department') ?? '');
		const { data: department } = await locals.supabase
			.from('departments')
			.select('id')
			.eq('id', departmentId)
			.maybeSingle();

		if (!department) return fail(400, { message: 'That department could not be found.' });

		const pinned = readPinnedBoardIds(cookies);
		if (departmentId !== locals.profile?.department_id && !pinned.includes(departmentId)) {
			writePinnedBoardIds(cookies, [...pinned, departmentId]);
		}
		redirect(303, `/notes?department=${encodeURIComponent(departmentId)}`);
	},

	/** Stop following a department board. */
	unpin: async ({ request, cookies }) => {
		const departmentId = String((await request.formData()).get('department') ?? '');
		writePinnedBoardIds(
			cookies,
			readPinnedBoardIds(cookies).filter((id) => id !== departmentId)
		);
		redirect(303, '/notes');
	}
};
