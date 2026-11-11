import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Profile, Suggestion } from '$lib/types';
import { loadTaxonomy } from '$lib/server/queries';

const ROLES = ['student', 'moderator', 'admin'] as const;

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/&/g, 'and')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 24);
}

function requireAdmin(profile: Profile | null) {
	return profile?.role === 'admin';
}

export const load: PageServerLoad = async ({ locals }) => {
	const profile = locals.profile as Profile;
	if (!requireAdmin(profile)) throw error(403, 'Administrator access required.');

	const [
		usersResult,
		newestUsersResult,
		suggestionsResult,
		roleResult,
		taxonomy,
		notesCount,
		suggestionsOpenCount,
		topNotesResult,
		oldestPendingResult,
		topSearchesResult,
		openReportsResult,
		recentReportsResult
	] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('id, full_name, role, department_id, program_id, created_at, department:departments(id, name, short_name), program:programs(id, name, code)')
			.order('created_at', { ascending: true })
			.limit(300),
		locals.supabase
			.from('profiles')
			.select('id, full_name, role, department_id, program_id, created_at, department:departments(id, name, short_name), program:programs(id, name, code)')
			.order('created_at', { ascending: false })
			.limit(6),
		locals.supabase
			.from('suggestions')
			.select('*, user:profiles!suggestions_user_id_fkey(id, full_name, avatar_color, role), subject:subjects(id, code, name)')
			.order('created_at', { ascending: false })
			.limit(40),
		locals.supabase.from('profiles').select('role'),
		loadTaxonomy(locals.supabase),
		locals.supabase.from('notes').select('*', { count: 'exact', head: true }),
		locals.supabase.from('suggestions').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
		locals.supabase
			.from('notes')
			.select('id, title, views, downloads, status, subject:subjects(code)')
			.order('views', { ascending: false })
			.limit(5),
		locals.supabase
			.from('notes')
			.select('id, title, created_at')
			.eq('status', 'submitted')
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle(),
		locals.supabase.rpc('top_searches', { p_limit: 8 }),
		locals.supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
		locals.supabase
			.from('reports')
			.select('*', { count: 'exact', head: true })
			.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
	]);

	const users = (usersResult.data ?? []) as unknown as Profile[];
	const roleCounts = (roleResult.data ?? []).reduce<Record<string, number>>((map, row) => {
		const role = (row as { role: string }).role;
		map[role] = (map[role] ?? 0) + 1;
		return map;
	}, {});

	return {
		user: locals.user,
		users,
		newestUsers: (newestUsersResult.data ?? []) as unknown as Profile[],
		suggestions: (suggestionsResult.data ?? []) as unknown as Suggestion[],
		taxonomy,
		analytics: {
			topNotes:
				(topNotesResult.error ? [] : (topNotesResult.data as unknown as {
					id: string;
					title: string;
					views: number;
					downloads: number;
					status: string;
					subject: { code: string } | null;
				}[])) ?? [],
			oldestPending: (oldestPendingResult.data as { id: string; title: string; created_at: string } | null) ?? null,
			topSearches:
				(topSearchesResult.error ? [] : (topSearchesResult.data as unknown as {
					query: string;
					hits: number;
					zero_hits: number;
				}[])) ?? [],
			openReports: openReportsResult.count ?? 0,
			reportsLast7Days: recentReportsResult.count ?? 0
		},
		counts: {
			users: users.length,
			students: roleCounts.student ?? 0,
			moderators: roleCounts.moderator ?? 0,
			admins: roleCounts.admin ?? 0,
			notes: notesCount.count ?? 0,
			suggestionsOpen: suggestionsOpenCount.count ?? 0
		}
	};
};

export const actions: Actions = {
	department: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const shortName = String(form.get('short_name') ?? '').trim().toUpperCase();
		const rawId = String(form.get('id') ?? '').trim();
		const color = String(form.get('color') ?? '#FFD34D').trim();
		const description = String(form.get('description') ?? '').trim();

		if (name.length < 3) return fail(400, { error: 'Department name needs at least 3 characters.' });
		if (!shortName) return fail(400, { error: 'Add a short name (for example, CS).' });
		if (!/^#[0-9a-fA-F]{6}$/.test(color)) return fail(400, { error: 'Color must be a hex value like #FFD34D.' });

		const id = rawId || slugify(shortName || name);
		if (!/^[a-z0-9-]{2,24}$/.test(id)) return fail(400, { error: 'Id must be 2–24 lowercase letters, numbers or dashes.' });

		const { error: insertError } = await locals.supabase.from('departments').insert({
			id,
			name,
			short_name: shortName,
			color,
			description: description || null,
			sort_order: Number(form.get('sort_order') ?? 99) || 99
		});

		if (insertError) return fail(400, { error: 'Could not add that department. Its id may already exist.' });
		return { success: true, message: `Department ${shortName} added.` };
	},

	program: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const departmentId = String(form.get('department_id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		const code = String(form.get('code') ?? '').trim().toUpperCase();
		const description = String(form.get('description') ?? '').trim();

		if (!departmentId) return fail(400, { error: 'Choose a department for the program.' });
		if (name.length < 3 || !code) return fail(400, { error: 'Program name and code are required.' });

		const { error: insertError } = await locals.supabase.from('programs').insert({
			department_id: departmentId,
			name,
			code,
			description: description || null
		});
		if (insertError) return fail(400, { error: 'Could not add that program. Check for a duplicate code.' });
		return { success: true, message: `Program ${code} added.` };
	},

	subject: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const departmentId = String(form.get('department_id') ?? '');
		const programId = String(form.get('program_id') ?? '');
		const code = String(form.get('code') ?? '').trim().toUpperCase();
		const name = String(form.get('name') ?? '').trim();
		const yearLevel = Number(form.get('year_level') ?? 0);
		const semester = Number(form.get('semester') ?? 0);
		const description = String(form.get('description') ?? '').trim();

		if (!departmentId) return fail(400, { error: 'Choose a department.' });
		if (name.length < 3 || !code) return fail(400, { error: 'Subject name and code are required.' });
		if (yearLevel && (yearLevel < 1 || yearLevel > 6)) return fail(400, { error: 'Year level must be 1–6.' });
		if (semester && (semester < 1 || semester > 2)) return fail(400, { error: 'Semester must be 1 or 2.' });

		if (programId) {
			const { data: program } = await locals.supabase
				.from('programs')
				.select('id, department_id')
				.eq('id', programId)
				.maybeSingle();
			if (!program || program.department_id !== departmentId) {
				return fail(400, { error: 'Choose a program that belongs to the selected department.' });
			}
		}

		const { error: insertError } = await locals.supabase.from('subjects').insert({
			department_id: departmentId,
			program_id: programId || null,
			code,
			name,
			year_level: yearLevel || null,
			semester: semester || null,
			description: description || null,
			is_community: true
		});
		if (insertError) return fail(400, { error: 'Could not add that subject.' });
		return { success: true, message: `Subject ${code} added.` };
	},

	topic: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const subjectId = String(form.get('subject_id') ?? '');
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim();

		if (!subjectId) return fail(400, { error: 'Choose a subject for the topic.' });
		if (name.length < 2) return fail(400, { error: 'Topic name is too short.' });

		const { error: insertError } = await locals.supabase.from('topics').insert({
			subject_id: subjectId,
			name,
			description: description || null
		});
		if (insertError) return fail(400, { error: 'Could not add that topic. It may already exist for this subject.' });
		return { success: true, message: `Topic “${name}” added.` };
	},

	taxonomyDelete: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const type = String(form.get('type') ?? '');
		const id = String(form.get('id') ?? '');
		if (!['programs', 'subjects', 'topics'].includes(type) || !id) {
			return fail(400, { error: 'Invalid taxonomy delete request.' });
		}

		const { error: deleteError } = await locals.supabase.from(type).delete().eq('id', id);
		if (deleteError) return fail(400, { error: 'Could not delete that item. Remove dependent records first.' });
		return { success: true, message: 'Taxonomy item deleted.' };
	},

	role: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const userId = String(form.get('user_id') ?? '');
		const role = String(form.get('role') ?? '') as (typeof ROLES)[number];

		if (!ROLES.includes(role)) return fail(400, { error: 'Invalid role.' });
		if (userId === locals.user!.id) return fail(400, { error: 'You cannot change your own admin role.' });

		const { error: updateError } = await locals.supabase.from('profiles').update({ role }).eq('id', userId);
		if (updateError) return fail(400, { error: 'Could not update that role.' });
		await locals.supabase.rpc('log_moderation_action', {
			p_action: 'role_changed',
			p_detail: `Role set to ${role} for ${userId}.`
		});
		return { success: true, message: `Role updated to ${role}.` };
	},

	suggestion: async ({ request, locals }) => {
		if (!requireAdmin(locals.profile)) return fail(403, { error: 'Administrator access required.' });
		const form = await request.formData();
		const suggestionId = String(form.get('suggestion_id') ?? '');
		const decision = String(form.get('decision') ?? '');
		const adminNote = String(form.get('admin_note') ?? '').trim();

		if (!['under_review', 'accepted', 'declined'].includes(decision)) {
			return fail(400, { error: 'Choose a valid suggestion decision.' });
		}

		const { error: updateError } = await locals.supabase
			.from('suggestions')
			.update({ status: decision, admin_note: adminNote || null })
			.eq('id', suggestionId);
		if (updateError) return fail(400, { error: 'Could not update that suggestion.' });
		await locals.supabase.rpc('log_moderation_action', {
			p_action: `suggestion_${decision}`,
			p_suggestion: suggestionId,
			p_detail: adminNote || null
		});
		return { success: true, message: 'Suggestion updated.' };
	}
};
