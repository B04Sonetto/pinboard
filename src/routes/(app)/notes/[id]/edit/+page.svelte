<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import { AlertCircle, ArrowLeft, FileText, Info, LoaderCircle, Paperclip, Save } from '@lucide/svelte';
	import { formatDate, wordCount } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const note = $derived(data.note);

	function pick(key: string, fallback = ''): string {
		const record = form as Record<string, unknown> | null | undefined;
		const value = record?.[key];
		return typeof value === 'string' ? value : fallback;
	}

	let department = $state(untrack(() => pick('department', note.department_id)));
	let program = $state(untrack(() => pick('program', note.program_id ?? '')));
	let subject = $state(untrack(() => pick('subject', note.subject_id)));
	let topic = $state(untrack(() => pick('topic', note.topic_id ?? '')));
	let yearLevel = $state(untrack(() => pick('year_level', note.year_level ? String(note.year_level) : '')));
	let semester = $state(untrack(() => pick('semester', note.semester ? String(note.semester) : '')));
	let visibility = $state(untrack(() => pick('visibility', note.visibility)));
	let contentText = $state(untrack(() => pick('content', note.content ?? note.content_text ?? '')));
	let tab = $state<'write' | 'preview'>('write');
	let submitting = $state(false);
	let removeFile = $state(false);
	let uploading = $state(false);
	let extractError = $state('');
	let extractedName = $state('');

	const programs = $derived(data.taxonomy.programs.filter((item) => item.department_id === department));
	const subjects = $derived(
		data.taxonomy.subjects.filter(
			(item) => item.department_id === department && (!program || item.program_id === program)
		)
	);
	const topics = $derived(data.taxonomy.topics.filter((item) => item.subject_id === subject));

	function onDepartmentChange() {
		program = '';
		subject = '';
		topic = '';
	}
	function onProgramChange() {
		subject = '';
		topic = '';
	}
	function onSubjectChange() {
		topic = '';
	}

	async function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		extractError = '';
		extractedName = '';
		if (!file) return;

		uploading = true;
		try {
			const body = new FormData();
			body.set('file', file);
			const response = await fetch('/api/extract', { method: 'POST', body });
			const result = await response.json();
			if (!response.ok) {
				extractError = result.error ?? 'Could not read that file.';
				return;
			}

			extractedName = `${result.fileName} · ${result.words} words`;
			removeFile = false;
			if (!contentText.trim()) contentText = result.text;
		} catch {
			extractError = 'Could not read that file. Paste the text into the editor instead.';
		} finally {
			uploading = false;
		}
	}
</script>

<svelte:head><title>Edit {note.title} · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker={note.status === 'rejected' ? 'Fix and resubmit' : 'While it is awaiting review'}
		title={note.status === 'rejected' ? 'Revise your note' : 'Edit your note'}
		description={note.status === 'rejected'
			? 'Address the moderator feedback below and resubmit your note. It will be re-queued for verification.'
			: 'You can revise a submitted note as often as you need before a moderator reviews it. Changes are saved in place.'}
	>
		<a href="/notes/{note.id}" class="btn btn-secondary"><ArrowLeft size={15} /> Back to note</a>
	</PageHeader>

	{#if note.status === 'rejected' && note.moderator_note}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] p-4">
			<p class="text-sm font-bold text-[#8f1c12]">Moderator feedback to address:</p>
			<p class="mt-1 text-[0.82rem] leading-relaxed text-[#6f1a12]">{note.moderator_note}</p>
		</div>
	{:else}
		<div class="rounded-xl border-2 border-ink bg-marigold-soft p-4">
			<p class="flex items-center gap-2 text-sm font-bold"><Info size={16} /> Editing: {note.title}</p>
			<p class="mt-1 text-[0.78rem] leading-relaxed text-ink-soft">
				Submitted {formatDate(note.created_at)}. Once verified, use “Submit a revision” instead so the verified version stays
				available.
			</p>
		</div>
	{/if}

	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {form.error}
		</div>
	{/if}

	<form
		method="POST"
		enctype="multipart/form-data"
		class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				try {
					await update();
				} finally {
					submitting = false;
				}
			};
		}}
	>
		<div class="flex min-w-0 flex-col gap-5">
			<section class="card p-4 sm:p-5">
				<h2 class="font-display text-lg font-extrabold">Where it belongs</h2>
				<div class="mt-4 grid gap-4 sm:grid-cols-2">
					<label class="flex flex-col">
						<span class="label">Department *</span>
						<select class="select" name="department_id" required bind:value={department} onchange={onDepartmentChange}>
							<option value="">Choose a department</option>
							{#each data.taxonomy.departments as item (item.id)}
								<option value={item.id}>{item.short_name} · {item.name}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label">Program (optional)</span>
						<select class="select" name="program_id" bind:value={program} onchange={onProgramChange} disabled={!department}>
							<option value="">Not program-specific</option>
							{#each programs as item (item.id)}
								<option value={item.id}>{item.code} · {item.name}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label">Subject *</span>
						<select class="select" name="subject_id" required bind:value={subject} onchange={onSubjectChange} disabled={!department}>
							<option value="">Choose a subject</option>
							{#each subjects as item (item.id)}
								<option value={item.id}>{item.code} · {item.name}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label">Topic (optional)</span>
						<select class="select" name="topic_id" bind:value={topic} disabled={!subject}>
							<option value="">General / no specific topic</option>
							{#each topics as item (item.id)}
								<option value={item.id}>{item.name}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label">Year level</span>
						<select class="select" name="year_level" bind:value={yearLevel}>
							<option value="">Not specified</option>
							{#each [1, 2, 3, 4, 5, 6] as year (year)}
								<option value={String(year)}>Year {year}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label">Semester</span>
						<select class="select" name="semester" bind:value={semester}>
							<option value="">Not specified</option>
							<option value="1">1st Semester</option>
							<option value="2">2nd Semester</option>
						</select>
					</label>
				</div>
			</section>

			<section class="card p-4 sm:p-5">
				<h2 class="font-display text-lg font-extrabold">The note</h2>
				<div class="mt-4 flex flex-col gap-4">
					<label class="flex flex-col">
						<span class="label">Title *</span>
						<input class="input" type="text" name="title" required minlength="4" maxlength="200" value={pick('title', note.title)} />
					</label>

					<label class="flex flex-col">
						<span class="label">Short summary *</span>
						<textarea class="textarea" name="summary" rows="2" required minlength="20" maxlength="600">{pick('summary', note.summary ?? '')}</textarea>
					</label>

					<div class="flex flex-col">
						<div class="mb-1.5 flex flex-wrap items-center justify-between gap-2">
							<span class="label !mb-0">Note body</span>
							<div class="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper p-0.5">
								<button type="button" class="tab !min-h-7 !px-2 !text-[0.7rem]" class:is-active={tab === 'write'} onclick={() => (tab = 'write')}>Write</button>
								<button type="button" class="tab !min-h-7 !px-2 !text-[0.7rem]" class:is-active={tab === 'preview'} onclick={() => (tab = 'preview')}>Preview</button>
							</div>
						</div>

						{#if tab === 'write'}
							<textarea
								class="textarea min-h-[20rem] font-mono !text-[0.82rem]"
								name="content"
								rows="15"
								bind:value={contentText}
							></textarea>
							<div class="mt-1 flex items-center justify-between text-[0.68rem] text-ink-faint">
								<span>{wordCount(contentText)} words</span>
								<span>Markdown supported</span>
							</div>
						{:else}
							<input type="hidden" name="content" value={contentText} />
							<div class="min-h-[20rem] rounded-lg border-2 border-dashed border-ink/30 bg-white p-4">
								{#if contentText.trim()}
									<Markdown content={contentText} />
								{:else}
									<p class="text-sm text-ink-faint">Nothing to preview yet.</p>
								{/if}
							</div>
						{/if}
					</div>

					<label class="flex flex-col">
						<span class="label">Keywords (optional)</span>
						<input class="input" type="text" name="keywords" value={pick('keywords', note.keywords?.join(', ') ?? '')} />
						<span class="hint mt-1">Comma-separated. Leave blank to regenerate from the note.</span>
					</label>

					<label class="flex flex-col">
						<span class="label">Source link (optional)</span>
						<input
							class="input"
							type="url"
							name="source_url"
							inputmode="url"
							placeholder="https://your-course-site.edu/syllabus"
							value={pick('source_url', note.source_url ?? '')}
						/>
						<span class="hint mt-1">Syllabus, textbook page or lecture reference this note is based on.</span>
					</label>
				</div>
			</section>

			<section class="card p-4 sm:p-5">
				<h2 class="flex items-center gap-2 font-display text-lg font-extrabold"><Paperclip size={17} /> Attachment</h2>
				{#if note.file_path}
					<div class="mt-3 flex items-center gap-2 rounded-lg border border-ink/20 bg-paper p-3">
						<FileText size={16} class="shrink-0" />
						<span class="min-w-0 flex-1 truncate text-[0.78rem] font-semibold">{note.file_name ?? 'Current attachment'}</span>
						<label class="flex cursor-pointer items-center gap-1.5 text-[0.72rem] font-semibold">
							<input type="checkbox" name="remove_file" bind:checked={removeFile} class="h-3.5 w-3.5 accent-[#211D31]" />
							Remove
						</label>
					</div>
				{:else}
					<p class="mt-2 text-[0.78rem] text-ink-soft">No attachment on this note yet.</p>
				{/if}

				<label class="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/40 bg-paper px-4 py-5 text-center transition hover:border-ink hover:bg-marigold-soft/40">
					<span class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-white">
						{#if uploading}<LoaderCircle size={17} class="animate-spin" />{:else}<FileText size={17} />{/if}
					</span>
					<span class="text-[0.8rem] font-bold">{uploading ? 'Reading the file…' : note.file_path ? 'Replace the attachment' : 'Add an attachment'}</span>
					<span class="text-[0.68rem] text-ink-soft">PDF, DOCX, TXT or Markdown, up to 15 MB.</span>
					<input type="file" name="file" accept=".pdf,.docx,.txt,.md,.markdown" class="sr-only" onchange={onFileChange} />
				</label>

				{#if extractError}
					<div class="mt-3 flex items-start gap-2 rounded-lg border border-[#B42318] bg-[#FFF1EF] p-2.5 text-[0.75rem] font-semibold text-[#8f1c12]">
						<AlertCircle size={14} class="mt-0.5 shrink-0" /> {extractError}
					</div>
				{/if}
				{#if extractedName}
					<p class="mt-2 text-[0.72rem] font-semibold text-[#155c3c]">{extractedName} ready to replace the current file.</p>
				{/if}
			</section>
		</div>

		<aside class="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
			<section class="card p-4">
				<h2 class="font-display text-lg font-extrabold">Visibility</h2>
				<fieldset class="mt-3 flex flex-col gap-2">
					<legend class="sr-only">Who should see this note?</legend>
					<label class="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-ink/30 bg-paper p-2.5 has-[:checked]:border-ink has-[:checked]:bg-marigold-soft">
						<input type="radio" name="visibility" value="community" bind:group={visibility} class="mt-0.5 h-4 w-4 accent-[#211D31]" />
						<span><span class="block text-[0.78rem] font-bold">Community-wide</span><span class="block text-[0.68rem] leading-snug text-ink-soft">Visible to all signed-in students once verified.</span></span>
					</label>
					<label class="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-ink/30 bg-paper p-2.5 has-[:checked]:border-ink has-[:checked]:bg-marigold-soft">
						<input type="radio" name="visibility" value="department" bind:group={visibility} class="mt-0.5 h-4 w-4 accent-[#211D31]" />
						<span><span class="block text-[0.78rem] font-bold">My department only</span><span class="block text-[0.68rem] leading-snug text-ink-soft">Limited to students in the same department.</span></span>
					</label>
				</fieldset>

				<button type="submit" class="btn btn-primary btn-lg mt-4 w-full" disabled={submitting || uploading}>
					{#if submitting}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
						Saving…
					{:else}
						<Save size={17} /> {note.status === 'rejected' ? 'Resubmit for review' : 'Save changes'}
					{/if}
				</button>
				<a href="/notes/{note.id}" class="btn btn-ghost btn-sm mt-2 w-full">Cancel</a>
			</section>

			<section class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="text-[0.78rem] font-bold">{note.status === 'rejected' ? 'Re-enters review queue' : 'Still awaiting review'}</p>
				<p class="mt-1 text-[0.72rem] leading-relaxed text-ink-soft">
					{note.status === 'rejected'
						? 'Saving will reset status to submitted so a moderator can verify your updated note.'
						: 'Your changes do not skip the queue. A moderator will still review this note before it becomes Community Verified.'}
				</p>
			</section>
		</aside>
	</form>
</div>
