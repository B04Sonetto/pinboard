interface PostgrestLikeError {
	code?: string;
	message?: string;
	details?: string | null;
	hint?: string | null;
}

const SETUP_HINT = 'Run supabase/setup.sql in the Supabase SQL editor, then try again.';

/**
 * Supabase hides the real reason behind generic codes. Turn the common ones
 * into something a student can act on instead of "please try again".
 */
export function noteWriteErrorMessage(
	error: PostgrestLikeError | null,
	action: 'save' | 'update' = 'save'
): string {
	const code = error?.code ?? '';
	const message = (error?.message ?? '').toLowerCase();

	if (code === '42501' || message.includes('row-level security')) {
		return 'Your account was not allowed to post this note. Sign out, sign in again, then check that your profile department matches the subject.';
	}
	if (code === '23503' || message.includes('foreign key')) {
		return 'The subject or topic you picked was removed while you were writing. Refresh the page and choose it again.';
	}
	if (code === '23514' || message.includes('violates check constraint')) {
		return 'One of the fields is outside the allowed range. Check the title, summary, year level and semester, then try again.';
	}
	if (code === 'PGRST204' || code === '42703' || message.includes('schema cache')) {
		return `The database is missing a column this form uses. ${SETUP_HINT}`;
	}
	if (code === '42P01' || message.includes('does not exist')) {
		return `The database tables are missing. ${SETUP_HINT}`;
	}
	if (code === '23505' || message.includes('duplicate key')) {
		return 'A record with those details already exists. Change the title or subject and try again.';
	}

	return error?.message
		? `Could not ${action} the note. Details: ${error.message}`
		: `Could not ${action} the note. Please try again.`;
}

export function bookmarkErrorMessage(error: PostgrestLikeError | null): string {
	const code = error?.code ?? '';
	const message = (error?.message ?? '').toLowerCase();

	if (code === '42501' || message.includes('row-level security')) {
		return 'Your session could not save this note. Sign out, sign in again, then retry.';
	}
	if (code === '23503' || message.includes('foreign key')) {
		return 'This note is no longer available to save.';
	}
	if (message.includes('no unique or exclusion constraint')) {
		return `Bookmarks need a database update. ${SETUP_HINT}`;
	}

	return error?.message ? `Could not save this note. Details: ${error.message}` : 'Could not save this note.';
}
