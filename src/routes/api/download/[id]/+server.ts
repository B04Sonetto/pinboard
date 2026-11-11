import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sanitizeFileName } from '$lib/server/extract';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) throw error(401, 'Sign in to download notes.');
	if (!UUID.test(params.id)) throw error(404, 'Note not found.');

	const { data: note, error: noteError } = await locals.supabase
		.from('notes')
		.select('id, title, content, content_text, file_path, file_name, downloads')
		.eq('id', params.id)
		.maybeSingle();

	if (noteError || !note) throw error(404, 'Note not found or you do not have access to it.');

	await locals.supabase.rpc('record_note_download', { target_note: note.id });

	if (note.file_path) {
		const { data: signed, error: signedError } = await locals.supabase.storage
			.from('note-files')
			.createSignedUrl(note.file_path, 90, {
				download: sanitizeFileName(note.file_name || `${note.title}.pdf`)
			});

		if (signedError || !signed?.signedUrl) {
			throw error(404, 'The attached file is no longer available.');
		}
		return new Response(null, {
			status: 303,
			headers: { location: signed.signedUrl, 'cache-control': 'no-store' }
		});
	}

	if (!note.content && !note.content_text) {
		throw error(404, 'This note has no downloadable content.');
	}

	const body = note.content || note.content_text || '';
	const fileName = sanitizeFileName(`${note.title}.md`);

	return new Response(body, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'content-disposition': `attachment; filename="${fileName}"`,
			'cache-control': 'no-store'
		}
	});
};
