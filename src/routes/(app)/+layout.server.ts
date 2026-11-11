import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { Activity, Profile } from '$lib/types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/login?redirect=${encodeURIComponent(url.pathname + url.search)}`);
	}

	if (locals.setupRequired) {
		redirect(303, '/setup');
	}

	const supabase = locals.supabase;
	let profile = locals.profile as Profile | null;

	if (!profile) {
		const fullName =
			(locals.user.user_metadata?.full_name as string | undefined) ??
			locals.user.email?.split('@')[0] ??
			'New student';

		const { data } = await supabase
			.from('profiles')
			.insert({ id: locals.user.id, full_name: fullName })
			.select('*, department:departments(*), program:programs(*)')
			.maybeSingle();

		profile = (data as Profile | null) ?? null;
	}

	if (!profile) {
		redirect(303, '/setup?reason=profile');
	}

	const [savedResult, contributionResult, attemptResult, activityResult, myNotesResult, departmentResult] = await Promise.all([
		supabase.from('bookmarks').select('*', { count: 'exact', head: true }).eq('user_id', locals.user.id),
		supabase.from('notes').select('*', { count: 'exact', head: true }).eq('author_id', locals.user.id),
		supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }).eq('user_id', locals.user.id),
		supabase
			.from('activity')
			.select(
				'id, kind, note_id, actor_id, meta, created_at, actor:profiles!activity_actor_id_fkey(id, full_name, avatar_color), note:notes!activity_note_id_fkey(id, title, status)'
			)
			.order('created_at', { ascending: false })
			.limit(6),
		supabase.from('notes').select('id').eq('author_id', locals.user.id).limit(200),
		supabase.from('departments').select('*').order('sort_order')
	]);

	const myNoteIds = (myNotesResult.data ?? []).map((row) => row.id as string);
	let notifications: Activity[] = [];
	let unread = 0;

	if (myNoteIds.length > 0) {
		const seenAt = profile.notifications_seen_at ?? new Date(0).toISOString();
		const [notificationResult, unreadResult] = await Promise.all([
			supabase
				.from('activity')
				.select(
					'id, kind, note_id, actor_id, meta, created_at, actor:profiles!activity_actor_id_fkey(id, full_name, avatar_color), note:notes!activity_note_id_fkey(id, title, status)'
				)
				.in('note_id', myNoteIds)
				.in('kind', ['note_verified', 'note_rejected'])
				.order('created_at', { ascending: false })
				.limit(8),
			supabase
				.from('activity')
				.select('*', { count: 'exact', head: true })
				.in('note_id', myNoteIds)
				.in('kind', ['note_verified', 'note_rejected'])
				.gt('created_at', seenAt)
		]);

		notifications = (notificationResult.error ? [] : (notificationResult.data as unknown as Activity[])) ?? [];
		unread = unreadResult.count ?? 0;
	}

	let moderation = 0;
	if (profile.role === 'moderator' || profile.role === 'admin') {
		const [notes, suggestions, reports] = await Promise.all([
			supabase.from('notes').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
			supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
			supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open')
		]);
		moderation = (notes.count ?? 0) + (suggestions.count ?? 0) + (reports.count ?? 0);
	}

	return {
		user: locals.user,
		profile,
		departments: ((departmentResult.data ?? []) as unknown as import('$lib/types').Department[]),
		counts: {
			saved: savedResult.count ?? 0,
			contributions: contributionResult.count ?? 0,
			attempts: attemptResult.count ?? 0,
			moderation
		},
		recentActivity: (activityResult.error ? [] : (activityResult.data as unknown as Activity[])) ?? [],
		notifications,
		unreadNotifications: unread
	};
};
