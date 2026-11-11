export type Role = 'student' | 'moderator' | 'admin';
export type NoteStatus = 'submitted' | 'verified' | 'rejected';
export type NoteVisibility = 'community' | 'department';
export type NoteOrigin = 'student' | 'ai';
export type StudyKind = 'reviewer' | 'summary' | 'quiz' | 'keywords';
export type StudyDifficulty = 'easy' | 'standard' | 'challenge';
export type SuggestionKind = 'course' | 'subject' | 'lesson' | 'correction' | 'platform';
export type SuggestionStatus = 'open' | 'under_review' | 'accepted' | 'declined';

export interface Department {
	id: string;
	name: string;
	short_name: string;
	color: string;
	description: string | null;
	sort_order: number;
}

export interface Program {
	id: string;
	department_id: string;
	name: string;
	code: string;
	description: string | null;
}

export interface Subject {
	id: string;
	program_id: string | null;
	department_id: string;
	code: string;
	name: string;
	year_level: number | null;
	semester: number | null;
	description: string | null;
	is_community: boolean;
}

export interface Topic {
	id: string;
	subject_id: string;
	name: string;
	description: string | null;
}

export interface Profile {
	id: string;
	full_name: string;
	role: Role;
	department_id: string | null;
	program_id: string | null;
	year_level: number | null;
	semester: number | null;
	bio: string | null;
	avatar_color: string;
	notifications_seen_at?: string;
	created_at: string;
	department?: Department | null;
	program?: Program | null;
}

export interface Note {
	id: string;
	author_id: string;
	department_id: string;
	program_id: string | null;
	subject_id: string;
	topic_id: string | null;
	title: string;
	summary: string;
	content: string | null;
	content_text: string | null;
	visibility: NoteVisibility;
	status: NoteStatus;
	origin: NoteOrigin;
	year_level: number | null;
	semester: number | null;
	keywords: string[];
	file_path: string | null;
	file_name: string | null;
	file_size: number | null;
	file_type: string | null;
	views: number;
	downloads: number;
	created_at: string;
	updated_at: string;
	verified_at: string | null;
	verified_by: string | null;
	moderator_note: string | null;
	source_url: string | null;
	revision_of: string | null;
	department?: Department | null;
	subject?: Subject | null;
	topic?: Topic | null;
	author?: Profile | null;
	verifier?: Profile | null;
}

export interface Bookmark {
	user_id: string;
	note_id: string;
	created_at: string;
}

export interface TopicBookmark {
	user_id: string;
	topic_id: string;
	created_at: string;
}

export interface Suggestion {
	id: string;
	user_id: string;
	kind: SuggestionKind;
	title: string;
	details: string;
	subject_id: string | null;
	status: SuggestionStatus;
	admin_note: string | null;
	created_at: string;
	updated_at: string;
	user?: Profile | null;
	subject?: Subject | null;
}

export interface QuizQuestion {
	id: string;
	type?: 'mc' | 'tf';
	prompt: string;
	options: string[];
	answer: number;
	explanation: string;
	sourceNoteId: string | null;
	sourceTitle: string | null;
}

export interface Flashcard {
	id: string;
	front: string;
	back: string;
	sourceNoteId: string | null;
	sourceTitle: string | null;
}

export interface StudyPayload {
	engine: string;
	questions?: QuizQuestion[];
	flashcards?: Flashcard[];
	keywords?: { term: string; count: number; notes: string[] }[];
	sources?: { id: string; title: string; status: NoteStatus }[];
	options?: Record<string, unknown>;
}

export interface StudyGeneration {
	id: string;
	user_id: string;
	kind: StudyKind;
	title: string;
	content: string;
	payload: StudyPayload;
	source_note_ids: string[];
	department_id: string | null;
	subject_id: string | null;
	topic_id: string | null;
	created_at: string;
	subject?: Subject | null;
	topic?: Topic | null;
}

export interface QuizAttempt {
	id: string;
	user_id: string;
	generation_id: string;
	score: number;
	total: number;
	answers: Record<string, number>;
	created_at: string;
	generation?: StudyGeneration | null;
}

export interface Activity {
	id: string;
	actor_id: string | null;
	kind: string;
	note_id: string | null;
	meta: Record<string, unknown> | null;
	created_at: string;
	actor?: Profile | null;
	note?: Pick<Note, 'id' | 'title' | 'status'> | null;
}

export interface Report {
	id: string;
	reporter_id: string;
	note_id: string;
	reason: string;
	details: string;
	status: 'open' | 'resolved' | 'dismissed';
	created_at: string;
	note?: Note | null;
	reporter?: Profile | null;
}

export interface ModerationAction {
	id: string;
	actor_id: string | null;
	action: string;
	note_id: string | null;
	suggestion_id: string | null;
	report_id: string | null;
	detail: string | null;
	created_at: string;
	actor?: Profile | null;
	note?: Pick<Note, 'id' | 'title'> | null;
}

export interface SubjectWithCount extends Subject {
	notes: { count: number }[];
	topics?: Topic[];
}

export interface TopicWithCount extends Topic {
	notes: { count: number }[];
	subject?: Subject | null;
}

export const DEPARTMENTS_FALLBACK: string[] = [];
