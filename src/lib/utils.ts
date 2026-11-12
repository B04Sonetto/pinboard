import type { Note, NoteStatus, StudyDifficulty, StudyKind, SuggestionStatus } from './types';

export function initials(name: string | null | undefined): string {
	if (!name) return '?';
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return '?';
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function firstName(name: string | null | undefined): string {
	if (!name) return 'there';
	return name.trim().split(/\s+/)[0] || 'there';
}

export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions) {
	if (!value) return '—';
	const date = typeof value === 'string' ? new Date(value) : value;
	if (Number.isNaN(date.getTime())) return '—';
	return new Intl.DateTimeFormat('en', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		...opts
	}).format(date);
}

export function relativeTime(value: string | Date | null | undefined): string {
	if (!value) return '';
	const date = typeof value === 'string' ? new Date(value) : value;
	const seconds = Math.round((date.getTime() - Date.now()) / 1000);
	const abs = Math.abs(seconds);
	const fmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
	if (abs < 60) return 'just now';
	if (abs < 3600) return fmt.format(Math.round(seconds / 60), 'minute');
	if (abs < 86400) return fmt.format(Math.round(seconds / 3600), 'hour');
	if (abs < 604800) return fmt.format(Math.round(seconds / 86400), 'day');
	if (abs < 2629800) return fmt.format(Math.round(seconds / 604800), 'week');
	return formatDate(date);
}

export function formatBytes(bytes: number | null | undefined): string {
	if (!bytes || bytes <= 0) return '0 KB';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function pluralize(count: number, singular: string, plural?: string) {
	return `${count} ${count === 1 ? singular : (plural ?? singular + 's')}`;
}

export function statusLabel(status: NoteStatus): string {
	switch (status) {
		case 'verified':
			return 'Published';
		case 'submitted':
			return 'Community Submitted';
		case 'rejected':
			return 'Rejected';
	}
}

export function statusClass(status: NoteStatus): string {
	switch (status) {
		case 'verified':
			return 'badge-verified';
		case 'submitted':
			return 'badge-submitted';
		case 'rejected':
			return 'badge-rejected';
	}
}

export function suggestionStatusLabel(status: SuggestionStatus): string {
	return status.replace('_', ' ');
}

export function studyKindLabel(kind: StudyKind): string {
	switch (kind) {
		case 'reviewer':
			return 'Study Reviewer';
		case 'summary':
			return 'Lesson Summary';
		case 'quiz':
			return 'Practice Quiz';
		case 'exam':
			return 'Practice Exam';
		case 'keywords':
			return 'Keyword List';
	}
}

export function studyDifficultyLabel(difficulty: StudyDifficulty | null | undefined): string {
	switch (difficulty) {
		case 'easy':
			return 'Foundation';
		case 'challenge':
			return 'Challenge';
		default:
			return 'Standard';
	}
}

export function yearLabel(year: number | null | undefined): string {
	if (!year) return '—';
	return `Year ${year}`;
}

export function semesterLabel(semester: number | null | undefined): string {
	if (!semester) return '—';
	return semester === 1 ? '1st Semester' : '2nd Semester';
}

export function greeting(date = new Date()): string {
	const hour = date.getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

export const DEFAULT_NOTE_COLOR = '#FFE680';

export function departmentTint(hex: string | null | undefined): string {
	return hex || DEFAULT_NOTE_COLOR;
}

/** Small stable hash so a note always gets the same tilt and pin colour. */
function hashId(id: string): number {
	let hash = 0;
	for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
	return Math.abs(hash);
}

const NOTE_TILTS = [-1.6, 1.2, -0.8, 1.8, -1.2, 0.9];
const PIN_COLORS = ['#E5484D', '#2F6FDB', '#1F8A5B', '#F59E0B'];

/** Rotation in degrees for a sticky note, derived from its id (stable across renders and pages). */
export function noteTilt(id: string): number {
	return NOTE_TILTS[hashId(id) % NOTE_TILTS.length];
}

export function pinColor(id: string): string {
	return PIN_COLORS[(hashId(id) >> 3) % PIN_COLORS.length];
}

export function truncate(text: string | null | undefined, length = 160): string {
	if (!text) return '';
	const clean = text.replace(/\s+/g, ' ').trim();
	if (clean.length <= length) return clean;
	return clean.slice(0, length).trimEnd() + '…';
}

/** Strip the most common markdown syntax for excerpts and meta descriptions. */
export function stripMarkdown(md: string | null | undefined): string {
	if (!md) return '';
	return md
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#>*_`~|-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function wordCount(text: string | null | undefined): number {
	if (!text) return 0;
	return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingTime(text: string | null | undefined): string {
	const minutes = Math.max(1, Math.round(wordCount(text) / 220));
	return `${minutes} min read`;
}

export function sortOptions() {
	return [
		{ value: 'newest', label: 'Newest first' },
		{ value: 'oldest', label: 'Oldest first' },
		{ value: 'popular', label: 'Most downloaded' }
	];
}

export function safeNext(value: string | null | undefined): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
		return '/dashboard';
	}
	return value;
}

/** Student numbers look like 0324-0574@lspu.edu.ph. Braces cannot live in a Svelte attribute pattern — `{4}` is compiled away. */
const LSPU_STUDENT_EMAIL = /^\d{4}-\d{4}@lspu\.edu\.ph$/;

export function normalizeLspuEmail(raw: string): string {
	let email = raw
		.trim()
		.toLowerCase()
		.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
		.replace(/\s+/g, '');
	const compact = email.match(/^(\d{8})@lspu\.edu\.ph$/);
	if (compact) email = `${compact[1].slice(0, 4)}-${compact[1].slice(4)}@lspu.edu.ph`;
	return email;
}

export function isLspuStudentEmail(raw: string): boolean {
	return LSPU_STUDENT_EMAIL.test(normalizeLspuEmail(raw));
}

export function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

/** Lower-case, strip punctuation/articles, and collapse spacing for free-text answers. */
export function normalizeFreeText(value: unknown): string {
	return String(value ?? '')
		.normalize('NFKC')
		.toLowerCase()
		.replace(/[’'`]/g, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.replace(/\b(?:the|a|an)\b/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Crude singular form: enough to accept "keys" for "key" without a dictionary. */
function singularize(value: string): string {
	return value
		.split(' ')
		.map((word) => (word.length > 4 && /ies$/.test(word) ? `${word.slice(0, -3)}y` : word.length > 3 && /s$/.test(word) && !/ss$/.test(word) ? word.slice(0, -1) : word))
		.join(' ');
}

function editDistance(a: string, b: string): number {
	if (a === b) return 0;
	if (!a.length) return b.length;
	if (!b.length) return a.length;
	let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
	for (let i = 1; i <= a.length; i += 1) {
		const current = [i];
		for (let j = 1; j <= b.length; j += 1) {
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
			);
		}
		previous = current;
	}
	return previous[b.length];
}

/**
 * Grade a typed identification answer. Accepts exact matches, plural/typo
 * variants, and answers that add a short qualifier ("primary key" for "key" is
 * not enough, but "database index" for "index" is).
 */
export function answersMatch(given: unknown, expected: unknown): boolean {
	const submitted = normalizeFreeText(given);
	const answer = normalizeFreeText(expected);
	if (!submitted || !answer) return false;
	if (submitted === answer) return true;

	const submittedSingular = singularize(submitted);
	const answerSingular = singularize(answer);
	if (submittedSingular === answerSingular) return true;

	const shorter =
		submittedSingular.length <= answerSingular.length ? submittedSingular : answerSingular;
	const longer =
		submittedSingular.length <= answerSingular.length ? answerSingular : submittedSingular;
	if (shorter.length >= 5 && longer.includes(shorter)) return true;

	const limit = Math.max(submittedSingular.length, answerSingular.length) >= 10 ? 2 : 1;
	return editDistance(submittedSingular, answerSingular) <= limit;
}

export type CitationStyle = 'apa' | 'mla' | 'chicago';

export function safeHttpUrl(value: string | null | undefined): string | null {
	const trimmed = (value ?? '').trim();
	if (!trimmed) return null;
	try {
		const url = new URL(trimmed);
		if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
	} catch {
		return null;
	}
	return null;
}

function authorParts(name: string | null | undefined): { last: string; first: string; plain: string } {
	const plain = name?.trim() || 'Pinboard contributor';
	const parts = plain.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return { last: 'Pinboard contributor', first: '', plain };
	if (parts.length === 1) return { last: parts[0], first: '', plain };
	return { last: parts[parts.length - 1], first: parts.slice(0, -1).join(' '), plain };
}

/**
 * Builds a plain-text citation for a community note. `url` is passed in so the
 * caller can use `location.href` on the client without this function touching
 * the DOM (it also runs during SSR).
 */
export function citationFor(note: Note, style: CitationStyle, url: string): string {
	const { last, first, plain } = authorParts(note.author?.full_name);
	const title = note.title.replace(/\s+/g, ' ').replace(/[.?!]+$/, '');
	const container = 'Pinboard';
	const published = new Date(note.verified_at ?? note.created_at);
	const safePublished = Number.isNaN(published.getTime()) ? new Date() : published;
	const year = safePublished.getFullYear();
	const monthDay = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' }).format(safePublished);
	const dayMonthYear = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(safePublished);
	const today = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
	const cleanUrl = url.split('#')[0];

	switch (style) {
		case 'mla': {
			const author = first ? `${last}, ${first}` : last;
			return `${author}. “${title}.” ${container}, ${dayMonthYear}, ${cleanUrl}.`;
		}
		case 'chicago': {
			const author = first ? `${last}, ${first}` : last;
			return `${author}. “${title}.” ${container}. Accessed ${today}. ${cleanUrl}.`;
		}
		default: {
			const initials = first
				.split(/\s+/)
				.filter(Boolean)
				.map((part) => `${part[0].toUpperCase()}.`)
				.join(' ');
			const author = initials ? `${last}, ${initials}` : last;
			return `${author}. (${year}, ${monthDay}). ${title}. ${container}. ${cleanUrl}`;
		}
	}
}

export function citationAuthors(note: Note): string {
	return authorParts(note.author?.full_name).plain;
}
