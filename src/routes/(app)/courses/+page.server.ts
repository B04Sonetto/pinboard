import type { PageServerLoad } from './$types';
import type { Department, Program, Subject } from '$lib/types';
import { loadTaxonomy } from '$lib/server/queries';

interface SubjectRow extends Subject {
	department?: Department | null;
	program?: Program | null;
	notes?: { count: number }[];
	topics?: { count: number }[];
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const q = (url.searchParams.get('q') ?? '').trim();
	const department = url.searchParams.get('department') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const [taxonomy, subjectResult] = await Promise.all([
		loadTaxonomy(supabase),
		supabase
			.from('subjects')
			.select('*, department:departments(*), program:programs(*), notes(count), topics(count)')
			.order('code')
	]);

	let subjects = (subjectResult.data ?? []) as unknown as SubjectRow[];
	if (department) subjects = subjects.filter((subject) => subject.department_id === department);
	if (year) subjects = subjects.filter((subject) => subject.year_level === Number(year));
	if (q) {
		const needle = q.toLowerCase();
		subjects = subjects.filter(
			(subject) =>
				subject.code.toLowerCase().includes(needle) ||
				subject.name.toLowerCase().includes(needle) ||
				subject.description?.toLowerCase().includes(needle) ||
				subject.program?.name.toLowerCase().includes(needle) ||
				subject.department?.name.toLowerCase().includes(needle)
		);
	}

	const grouped = new Map<
		string,
		{ department: Department; programs: { program: Program | null; subjects: SubjectRow[] }[] }
	>();

	for (const subject of subjects) {
		const dept = subject.department;
		if (!dept) continue;
		const group = grouped.get(dept.id) ?? { department: dept, programs: [] };
		const programEntry = group.programs.find((entry) => (entry.program?.id ?? '') === (subject.program?.id ?? ''));
		if (programEntry) programEntry.subjects.push(subject);
		else group.programs.push({ program: subject.program ?? null, subjects: [subject] });
		grouped.set(dept.id, group);
	}

	return {
		taxonomy,
		subjects,
		groups: [...grouped.values()].sort((a, b) => a.department.sort_order - b.department.sort_order),
		filters: { q, department, year },
		error: subjectResult.error ? subjectResult.error.message : null
	};
};
