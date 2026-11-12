import type { SupabaseClient } from '@supabase/supabase-js';
import type { Department, Program, Subject, Topic } from '$lib/types';

export const NOTE_CARD_SELECT =
	'id, author_id, department_id, program_id, subject_id, topic_id, title, summary, visibility, status, origin, year_level, semester, keywords, file_path, file_name, file_size, file_type, views, downloads, created_at, updated_at, department:departments(*), subject:subjects(*), topic:topics(*), author:profiles!notes_author_id_fkey(id, full_name, avatar_color, role)';

export const NOTE_FULL_SELECT = `${NOTE_CARD_SELECT}, content, content_text, verified_at, verified_by, moderator_note, source_url, revision_of, verifier:profiles!notes_verified_by_fkey(id, full_name, avatar_color, role)`;

export interface Taxonomy {
	departments: Department[];
	programs: Program[];
	subjects: (Subject & { topics?: Topic[] })[];
	topics: Topic[];
}

export async function loadTaxonomy(supabase: SupabaseClient): Promise<Taxonomy> {
	const [departments, programs, subjects, topics] = await Promise.all([
		supabase.from('departments').select('*').order('sort_order'),
		supabase.from('programs').select('*').order('name'),
		supabase.from('subjects').select('*').order('code'),
		supabase.from('topics').select('*').order('name')
	]);

	for (const result of [departments, programs, subjects, topics]) {
		if (result.error) console.error('[taxonomy] load failed', result.error);
	}

	return {
		departments: (departments.data ?? []) as Department[],
		programs: (programs.data ?? []) as Program[],
		subjects: (subjects.data ?? []) as Subject[],
		topics: (topics.data ?? []) as Topic[]
	};
}

export async function savedNoteIds(
	supabase: SupabaseClient,
	userId: string,
	noteIds?: string[]
): Promise<Set<string>> {
	let query = supabase.from('bookmarks').select('note_id').eq('user_id', userId);
	if (noteIds && noteIds.length > 0) query = query.in('note_id', noteIds);
	if (noteIds && noteIds.length === 0) return new Set();
	const { data, error } = await query.limit(1000);
	if (error) return new Set();
	return new Set((data ?? []).map((row) => row.note_id as string));
}

export async function savedTopicIds(
	supabase: SupabaseClient,
	userId: string,
	topicIds?: string[]
): Promise<Set<string>> {
	let query = supabase.from('topic_bookmarks').select('topic_id').eq('user_id', userId);
	if (topicIds && topicIds.length > 0) query = query.in('topic_id', topicIds);
	if (topicIds && topicIds.length === 0) return new Set();
	const { data, error } = await query.limit(1000);
	if (error) return new Set();
	return new Set((data ?? []).map((row) => row.topic_id as string));
}

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
	const map = new Map<string, T>();
	for (const item of items) map.set(item.id, item);
	return [...map.values()];
}
