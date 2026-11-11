import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ModerationAction, Note, Profile, Suggestion } from '$lib/types';
import { NOTE_FULL_SELECT } from '$lib/server/queries';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PAGE_SIZE = 20;
const TABS = ['notes', 'suggestions', 'reports', 'audit'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	const profile = locals.profile as Profile;
	if (profile.role !== 'moderator' && profile.role !== 'admin') {
		throw error(403, 'Moderator access required.');
	}

	const tabParam = url.searchParams.get('tab');
	const tab = (TABS as readonly string[]).includes(tabParam ?? '') ? (tabParam as (typeof TABS)[number]) : 'notes';
	const department = url.searchParams.get('department') ?? '';
	const subject = url.searchParams.get('subject') ?? '';
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const from = (page - 1) * PAGE_SIZE;

	let notesQuery = locals.supabase
		.from('notes')
		.select(NOTE_FULL_SELECT, { count: 'exact' })
		.eq('status', 'submitted');
	if (department) notesQuery = notesQuery.eq('department_id', department);
	if (subject && UUID.test(subject)) notesQuery = notesQuery.eq('subject_id', subject);
	notesQuery = notesQuery.order('created_at', { ascending: true }).range(from, from + PAGE_SIZE - 1);

	const [notesResult, suggestionsResult, reportsResult, auditResult, verifiedResult, openNotesResult, departmentsResult, subjectsResult] =
		await Promise.all([
			notesQuery,
			locals.supabase
				.from('suggestions')
				.select('*, user:profiles!suggestions_user_id_fkey(id, full_name, avatar_color, role), subject:subjects(id, code, name)', { count: 'exact' })
				.in('status', ['open', 'under_review'])
				.order('created_at', { ascending: true })
				.limit(50),
			locals.supabase
				.from('reports')
				.select(
					`id, reason, details, status, created_at, reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_color, role), note:notes!reports_note_id_fkey(${NOTE_FULL_SELECT})`,
					{ count: 'exact' }
				)
				.eq('status', 'open')
				.order('created_at', { ascending: true })
				.limit(50),
			locals.supabase
				.from('moderation_actions')
				.select(
					'id, actor_id, action, note_id, suggestion_id, report_id, detail, created_at, actor:profiles!moderation_actions_actor_id_fkey(id, full_name, avatar_color, role), note:notes!moderation_actions_note_id_fkey(id, title)',
					{ count: 'exact' }
				)
				.order('created_at', { ascending: false })
				.limit(30),
			locals.supabase.from('notes').select('*', { count: 'exact', head: true }).eq('status', 'verified'),
			locals.supabase.from('notes').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
			locals.supabase.from('departments').select('id, name, short_name, color').order('sort_order'),
			locals.supabase.from('subjects').select('id, code, name, department_id').order('code')
		]);

	const reports = (reportsResult.data ?? []) as unknown as {
		id: string;
		reason: string;
		details: string;
		status: string;
		created_at: string;
		reporter: Pick<Profile, 'id' | 'full_name' | 'avatar_color' | 'role'> | null;
		note: Note | null;
	}[];
	const queue = (notesResult.data ?? []) as unknown as Note[];
	const total = notesResult.count ?? 0;

	return {
		tab,
		queue,
		suggestions: (suggestionsResult.data ?? []) as unknown as Suggestion[],
		reports,
		audit: (auditResult.error ? [] : (auditResult.data as unknown as ModerationAction[])) ?? [],
		departments: (departmentsResult.data ?? []) as { id: string; name: string; short_name: string; color: string }[],
		subjects: (subjectsResult.data ?? []) as { id: string; code: string; name: string; department_id: string }[],
		filters: { department, subject, page },
		pagination: { total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
		counts: {
			notes: openNotesResult.count ?? 0,
			suggestions: suggestionsResult.count ?? ((suggestionsResult.data ?? []) as unknown[]).length,
			reports: reportsResult.count ?? reports.length,
			audit: auditResult.count ?? ((auditResult.data ?? []) as unknown[]).length,
			verified: verifiedResult.count ?? 0
		}
	};
};

export const actions: Actions = {
	verify: async ({ request, locals }) => {
		const profile = locals.profile as Profile;
		if (profile.role !== 'moderator' && profile.role !== 'admin') return fail(403, { error: 'Moderator access required.' });

		const form = await request.formData();
		const noteId = String(form.get('note_id') ?? '');
		const moderatorNote = String(form.get('moderator_note') ?? '').trim();

		const { error: updateError } = await locals.supabase
			.from('notes')
			.update({
				status: 'verified',
				verified_at: new Date().toISOString(),
				verified_by: locals.user!.id,
				moderator_note: moderatorNote || null
			})
			.eq('id', noteId);

		if (updateError) return fail(400, { error: 'Could not verify that note.' });
		await locals.supabase.rpc('log_moderation_action', {
			p_action: 'note_verified',
			p_note: noteId,
			p_detail: moderatorNote || null
		});
		return { success: true, message: 'Note verified and published to the community.' };
	},

	reject: async ({ request, locals }) => {
		const profile = locals.profile as Profile;
		if (profile.role !== 'moderator' && profile.role !== 'admin') return fail(403, { error: 'Moderator access required.' });

		const form = await request.formData();
		const noteId = String(form.get('note_id') ?? '');
		const moderatorNote = String(form.get('moderator_note') ?? '').trim();
		if (moderatorNote.length < 5) {
			return fail(400, { error: 'Add a short note explaining what the author should fix.' });
		}

		const { error: updateError } = await locals.supabase
			.from('notes')
			.update({ status: 'rejected', verified_at: null, verified_by: locals.user!.id, moderator_note: moderatorNote })
			.eq('id', noteId);

		if (updateError) return fail(400, { error: 'Could not return that note.' });
		await locals.supabase.rpc('log_moderation_action', {
			p_action: 'note_rejected',
			p_note: noteId,
			p_detail: moderatorNote
		});
		return { success: true, message: 'Note returned to the author with feedback.' };
	},

	bulkVerify: async ({ request, locals }) => {
		const profile = locals.profile as Profile;
		if (profile.role !== 'moderator' && profile.role !== 'admin') return fail(403, { error: 'Moderator access required.' });

		const form = await request.formData();
		const ids = [...new Set(form.getAll('note_ids').map(String).filter((id) => UUID.test(id)))].slice(0, 25);
		if (ids.length === 0) return fail(400, { error: 'Select at least one note to verify.' });

		const { data, error: updateError } = await locals.supabase
			.from('notes')
			.update({
				status: 'verified',
				verified_at: new Date().toISOString(),
				verified_by: locals.user!.id
			})
			.in('id', ids)
			.eq('status', 'submitted')
			.select('id');

		if (updateError) return fail(400, { error: 'Could not verify the selected notes.' });

		const verifiedIds = (data ?? []).map((row) => row.id as string);
		await Promise.all(
			verifiedIds.map((id) =>
				locals.supabase.rpc('log_moderation_action', { p_action: 'note_verified_bulk', p_note: id })
			)
		);

		return { success: true, message: `${verifiedIds.length} note${verifiedIds.length === 1 ? '' : 's'} verified.` };
	},

	suggestion: async ({ request, locals }) => {
		const profile = locals.profile as Profile;
		if (profile.role !== 'moderator' && profile.role !== 'admin') return fail(403, { error: 'Moderator access required.' });

		const form = await request.formData();
		const suggestionId = String(form.get('suggestion_id') ?? '');
		const decision = String(form.get('decision') ?? '');
		const adminNote = String(form.get('admin_note') ?? '').trim();

		if (!['under_review', 'accepted', 'declined'].includes(decision)) {
			return fail(400, { error: 'Choose a valid decision.' });
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
	},

	report: async ({ request, locals }) => {
		const profile = locals.profile as Profile;
		if (profile.role !== 'moderator' && profile.role !== 'admin') return fail(403, { error: 'Moderator access required.' });

		const form = await request.formData();
		const reportId = String(form.get('report_id') ?? '');
		const decision = String(form.get('decision') ?? '');
		const noteId = String(form.get('note_id') ?? '');
		const removeNote = form.get('remove_note') === 'on';

		if (!['resolved', 'dismissed'].includes(decision)) {
			return fail(400, { error: 'Choose whether the report is resolved or dismissed.' });
		}

		if (removeNote && noteId) {
			const { data: note } = await locals.supabase
				.from('notes')
				.select('file_path')
				.eq('id', noteId)
				.maybeSingle();

			const { error: deleteError } = await locals.supabase.from('notes').delete().eq('id', noteId);
			if (deleteError) return fail(400, { error: 'Could not remove the reported note.' });

			if (note?.file_path) {
				await locals.supabase.storage.from('note-files').remove([note.file_path]);
			}

			// The note and its report are deleted here (reports cascade), so the
			// audit row cannot reference either row anymore. Keep the IDs in the
			// detail text instead of violating the foreign keys.
			await locals.supabase.rpc('log_moderation_action', {
				p_action: 'note_removed',
				p_note: null,
				p_report: null,
				p_detail: `Removed note ${noteId} after report ${reportId}.`
			});

			return { success: true, message: 'Reported note removed and report closed.' };
		}

		const { error: updateError } = await locals.supabase
			.from('reports')
			.update({ status: decision })
			.eq('id', reportId);

		if (updateError) return fail(400, { error: 'Could not close that report.' });
		await locals.supabase.rpc('log_moderation_action', {
			p_action: `report_${decision}`,
			p_note: noteId || null,
			p_report: reportId
		});
		return { success: true, message: decision === 'resolved' ? 'Report marked resolved.' : 'Report dismissed.' };
	}
};
