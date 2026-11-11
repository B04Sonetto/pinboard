import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractFile } from '$lib/server/extract';
import { checkRateLimit } from '$lib/server/rate-limit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) return json({ error: 'Sign in to upload notes.' }, { status: 401 });

	// Rate limit: 15 extract requests per minute per user
	if (!checkRateLimit(`extract:${locals.user.id}`, 15, 60_000)) {
		return json({ error: 'Too many upload attempts. Please wait a minute before trying again.' }, { status: 429 });
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: 'Could not read the upload.' }, { status: 400 });
	}

	const file = form.get('file');
	if (!(file instanceof File)) {
		return json({ error: 'Choose a file to upload.' }, { status: 400 });
	}

	try {
		const extracted = await extractFile(file);
		return json({
			ok: true,
			title: extracted.title,
			text: extracted.text,
			words: extracted.words,
			keywords: extracted.keywords,
			fileType: extracted.fileType,
			fileName: file.name,
			fileSize: file.size
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Could not read that file.';
		return json({ error: message }, { status: 400 });
	}
};
