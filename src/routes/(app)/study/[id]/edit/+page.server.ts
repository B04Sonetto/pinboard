import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { StudyGeneration } from '$lib/types';
import { generateStudy, type StudySource } from '$lib/server/study-engine';
import { checkRateLimit } from '$lib/server/rate-limit';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!UUID.test(params.id)) throw error(404, 'Reviewer not found.');

	const { data, error: loadError } = await locals.supabase
		.from('ai_generations')
		.select('id, user_id, kind, title, content, payload, source_note_ids, department_id, subject_id, topic_id, created_at')
		.eq('id', params.id)
		.eq('user_id', locals.user!.id)
		.maybeSingle();

	if (loadError || !data) throw error(404, 'That reviewer was not found.');
	const generation = data as StudyGeneration;
	if (generation.kind !== 'reviewer') throw error(404, 'Only study reviewers can be edited.');

	return { generation };
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		if (!UUID.test(params.id)) return fail(404, { error: 'Reviewer not found.' });

		const form = await request.formData();
		const title = String(form.get('title') ?? '').trim();
		const content = String(form.get('content') ?? '').trim();
		const intent = String(form.get('intent') ?? 'save');
		const values = { title, content };

		if (title.length < 4) return fail(400, { error: 'Use a title of at least 4 characters.', ...values });
		if (title.length > 200) return fail(400, { error: 'Keep the title under 200 characters.', ...values });
		if (content.length < 80) return fail(400, { error: 'Keep at least 80 characters in the reviewer.', ...values });
		if (content.length > 120_000) {
			return fail(400, { error: 'Keep the reviewer under 120,000 characters.', ...values });
		}
		if (intent !== 'save' && intent !== 'quiz') {
			return fail(400, { error: 'Choose whether to save the reviewer or build a quiz.', ...values });
		}

		if (intent === 'quiz' && !checkRateLimit(`study:${locals.user!.id}`, 10, 60_000)) {
			return fail(429, { error: 'Too many quiz generations. Please wait a minute before trying again.', ...values });
		}

		const { data: current, error: updateError } = await locals.supabase
			.from('ai_generations')
			.update({ title, content })
			.eq('id', params.id)
			.eq('user_id', locals.user!.id)
			.eq('kind', 'reviewer')
			.select('id, title, content, source_note_ids, department_id, subject_id, topic_id')
			.maybeSingle();

		if (updateError) {
			console.error('Could not update study reviewer:', updateError.message);
			return fail(400, {
				error: updateError.code === '42501'
					? 'Your database does not allow reviewer edits yet. Apply the latest generated-material editing migration, then try again.'
					: 'Could not save your reviewer. Please try again.',
				...values
			});
		}
		if (!current) return fail(404, { error: 'That reviewer was not found or is no longer yours to edit.', ...values });

		if (intent === 'save') redirect(303, `/study/${params.id}`);

		const source: StudySource = {
			id: 'own-notes',
			title: current.title,
			status: 'submitted',
			summary: current.content,
			content: current.content
		};
		let result;
		try {
			result = generateStudy('quiz', [source], { questionCount: 8, difficulty: 'standard' });
		} catch (generationError) {
			return fail(400, {
				error: `Your reviewer was saved, but a quiz could not be built: ${generationError instanceof Error ? generationError.message : 'The reviewer needs more study content.'}`,
				saved: true,
				...values
			});
		}

		const { data: quiz, error: insertError } = await locals.supabase
			.from('ai_generations')
			.insert({
				user_id: locals.user!.id,
				kind: 'quiz',
				title: result.title.slice(0, 200),
				content: result.content,
				payload: result.payload,
				source_note_ids: current.source_note_ids ?? [],
				department_id: current.department_id,
				subject_id: current.subject_id,
				topic_id: current.topic_id
			})
			.select('id')
			.single();

		if (insertError || !quiz) {
			console.error('Could not save reviewer quiz:', insertError?.message ?? 'No row returned.');
			return fail(400, {
				error: 'Your reviewer was saved, but the quiz could not be saved. Check the database schema and try again.',
				saved: true,
				...values
			});
		}

		redirect(303, `/study/${quiz.id}/quiz`);
	}
};
