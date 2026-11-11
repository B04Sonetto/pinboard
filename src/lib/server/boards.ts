import type { Cookies } from '@sveltejs/kit';

/**
 * Extra department boards a student chose to follow (the "+" tab on /notes).
 *
 * This lives in a cookie rather than localStorage so the server can render the
 * tabs and their note counts on the first paint, and so the choice follows the
 * student across the sidebar-free layout without any client-side syncing.
 * Only department ids are stored, and they are re-validated against the
 * departments table on every read, so a tampered cookie can't do anything.
 */
export const BOARDS_COOKIE = 'pinboard_boards';

const MAX_PINNED = 12;
const ID_SHAPE = /^[\w-]{1,64}$/;

export function readPinnedBoardIds(cookies: Cookies): string[] {
	const raw = cookies.get(BOARDS_COOKIE) ?? '';
	const ids = raw
		.split(',')
		.map((id) => id.trim())
		.filter((id) => ID_SHAPE.test(id));
	return [...new Set(ids)].slice(0, MAX_PINNED);
}

export function writePinnedBoardIds(cookies: Cookies, ids: string[]) {
	cookies.set(BOARDS_COOKIE, [...new Set(ids)].slice(0, MAX_PINNED).join(','), {
		path: '/',
		maxAge: 60 * 60 * 24 * 365,
		sameSite: 'lax',
		httpOnly: true
	});
}
