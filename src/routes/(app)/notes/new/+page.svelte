<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Markdown from '$lib/components/Markdown.svelte';
	import {
		AlertCircle,
		CheckCircle2,
		FileText,
		Info,
		Lightbulb,
		LoaderCircle,
		Paperclip,
		ShieldCheck,
		Sparkles,
		Upload,
		X
	} from '@lucide/svelte';
	import { wordCount } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function val(key: string, fallback = ''): string {
		const record = form as Record<string, unknown> | null | undefined;
		const value = record?.[key];
		return typeof value === 'string' ? value : fallback;
	}

	let department = $state(untrack(() => val('department', data.defaults.department)));
	let program = $state(untrack(() => val('program', data.defaults.program)));
	let subject = $state(untrack(() => val('subject', data.defaults.subject || data.revision?.subject_id || '')));
	let topic = $state(untrack(() => val('topic', data.revision?.topic_id ?? '')));
	let yearLevel = $state(
		untrack(() => val('year_level', data.defaults.year_level ? String(data.defaults.year_level) : ''))
	);
	let semester = $state(
		untrack(() => val('semester', data.defaults.semester ? String(data.defaults.semester) : ''))
	);
	let tab = $state<'write' | 'preview'>('write');
	let submitting = $state(false);
	let uploading = $state(false);
	let extracted = $state<{ title: string; words: number; keywords: string[]; fileName: string } | null>(null);
	let extractError = $state('');

	const programs = $derived(data.taxonomy.programs.filter((item) => item.department_id === department));
	const subjects = $derived(
		data.taxonomy.subjects.filter(
			(item) => item.department_id === department && (!program || item.program_id === program)
		)
	);
	const topics = $derived(data.taxonomy.topics.filter((item) => item.subject_id === subject));
	let contentText = $state(untrack(() => val('content', data.revision?.content ?? '')));
	const contentValue = $derived(contentText);

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
		extracted = null;
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

			extracted = {
				title: result.title,
				words: result.words,
				keywords: result.keywords ?? [],
				fileName: result.fileName
			};

			const titleInput = document.querySelector<HTMLInputElement>('input[name="title"]');
			const contentArea = document.querySelector<HTMLTextAreaElement>('textarea[name="content"]');
			const keywordInput = document.querySelector<HTMLInputElement>('input[name="keywords"]');
			if (titleInput && !titleInput.value.trim()) titleInput.value = result.title;
			if (!contentText.trim()) contentText = result.text;
			if (contentArea && !contentArea.value.trim()) contentArea.value = result.text;
			if (keywordInput && !keywordInput.value.trim()) keywordInput.value = (result.keywords ?? []).join(', ');
		} catch {
			extractError = 'Could not read that file. Paste the text into the editor instead.';
		} finally {
			uploading = false;
		}
	}

	function clearFile() {
		const input = document.querySelector<HTMLInputElement>('input[name="file"]');
		if (input) input.value = '';
		extracted = null;
		extractError = '';
	}
</script>

<svelte:head><title>Write a note · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker={data.revision ? 'Submit a revision' : 'Contribute to the board'}
		title={data.revision ? 'Revise your note' : 'Write a note'}
		description="Share what you learned in a way another student can actually use. Notes are reviewed by student moderators before they appear community-wide."
	>
		<a href="/notes" class="btn btn-secondary">Cancel</a>
	</PageHeader>

	{#if data.revision}
		<div class="rounded-xl border-2 border-ink bg-marigold-soft p-4">
			<p class="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> Revising: {data.revision.title}</p>
			<p class="mt-1 text-[0.78rem] leading-relaxed text-ink-soft">
				This creates a fresh submission. The original note stays as-is until a moderator reviews the revision.
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
		class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		{#if data.revision}
			<input type="hidden" name="revision_of" value={data.revision.id} />
		{/if}
		<div class="flex min-w-0 flex-col gap-5">
			<section class="card p-4 sm:p-5">
				<h2 class="font-display text-lg font-extrabold">1. Where does this belong?</h2>
				<p class="mt-1 text-[0.78rem] text-ink-soft">
					Notes are filed under your enrolled department so course materials stay authentic and organized.
				</p>

				{#if data.enrolledDepartment}
					<div
						class="mt-3 flex items-center justify-between rounded-xl border-2 border-ink p-3"
						style="background-color: var(--color-paper-card); border-left-width: 6px; border-left-color: {data.enrolledDepartment.color || '#FFD34D'}"
					>
						<div class="min-w-0">
							<p class="font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
								Your Enrolled Department (Locked)
							</p>
							<p class="font-display text-base font-extrabold leading-tight">
								{data.enrolledDepartment.name} ({data.enrolledDepartment.short_name})
							</p>
							<p class="text-[0.68rem] text-ink-soft">
								Cross-posting to another department is disabled to keep courses clear.
							</p>
						</div>
						<input type="hidden" name="department_id" value={data.enrolledDepartment.id} />
						<span class="chip chip-soft !text-[0.62rem] shrink-0 font-bold">🔒 Locked</span>
					</div>
				{:else}
					<div class="mt-3 rounded-xl border-2 border-amber-600 bg-amber-50 p-3 text-xs text-amber-900">
						<p class="font-bold">You haven't set your enrolled department yet.</p>
						<p class="mt-0.5">Please choose your department below. This will become your enrolled department.</p>
					</div>
					<label class="mt-3 flex flex-col">
						<span class="label">Select your enrolled department *</span>
						<select class="select" name="department_id" required bind:value={department} onchange={onDepartmentChange}>
							<option value="">Choose a department</option>
							{#each data.taxonomy.departments as item (item.id)}
								<option value={item.id}>{item.short_name} · {item.name}</option>
							{/each}
						</select>
					</label>
				{/if}

				<div class="mt-4 grid gap-4 sm:grid-cols-2">
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
						{#if department && subjects.length === 0}
							<span class="hint mt-1">No subjects listed yet for this department. Suggest one from Suggestions.</span>
						{/if}
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
				<h2 class="font-display text-lg font-extrabold">2. Write the note</h2>
				<p class="mt-1 text-[0.78rem] text-ink-soft">Markdown is supported: headings, lists, tables, code blocks and emphasis.</p>

				<div class="mt-4 flex flex-col gap-4">
					<label class="flex flex-col">
						<span class="label">Title *</span>
						<input
							class="input"
							type="text"
							name="title"
							required
							minlength="4"
							maxlength="200"
							placeholder="e.g. Normalization: 1NF to 3NF"
							value={val('title', data.revision?.title ?? '')}
						/>
					</label>

					<label class="flex flex-col">
						<span class="label">Short summary *</span>
						<textarea
							class="textarea"
							name="summary"
							rows="2"
							required
							minlength="20"
							maxlength="600"
							placeholder="One or two sentences on what this note covers and who it helps."
						>{val('summary', data.revision?.summary ?? '')}</textarea>
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
								class="textarea min-h-[22rem] font-mono !text-[0.82rem]"
								name="content"
								rows="16"
								bind:value={contentText}
								placeholder={'# Heading\n\nStart with the big idea, then break it into sections.\n\n## Key points\n\n- First point\n- Second point'}
							></textarea>
							<div class="mt-1 flex items-center justify-between text-[0.68rem] text-ink-faint">
								<span>{wordCount(contentValue)} words</span>
								<span>Use # headings to organize long notes</span>
							</div>
						{:else}
							<input type="hidden" name="content" value={contentValue} />
							<div class="min-h-[22rem] rounded-lg border-2 border-dashed border-ink/30 bg-white p-4">
								{#if contentValue.trim()}
									<Markdown content={contentValue} />
								{:else}
									<p class="text-sm text-ink-faint">Nothing to preview yet. Switch back to Write and start typing.</p>
								{/if}
							</div>
						{/if}
					</div>

					<label class="flex flex-col">
						<span class="label">Keywords (optional)</span>
						<input
							class="input"
							type="text"
							name="keywords"
							placeholder="normalization, 1nf, functional dependency"
							value={val('keywords', data.revision?.keywords?.join(', ') ?? '')}
						/>
						<span class="hint mt-1">Comma-separated. Leave blank and we will suggest keywords from your note.</span>
					</label>

					<label class="flex flex-col">
						<span class="label">Source link (optional)</span>
						<input
							class="input"
							type="url"
							name="source_url"
							inputmode="url"
							placeholder="https://your-course-site.edu/syllabus"
							value={val('source_url', data.revision?.source_url ?? '')}
						/>
						<span class="hint mt-1">
							Link the syllabus, textbook page or lecture reference this note is based on. It appears on the note as
							provenance, not as an official university endorsement.
						</span>
					</label>
				</div>
			</section>

			<section class="card p-4 sm:p-5">
				<h2 class="flex items-center gap-2 font-display text-lg font-extrabold"><Paperclip size={17} /> 3. Attach a file (optional)</h2>
				<p class="mt-1 text-[0.78rem] leading-relaxed text-ink-soft">
					PDF, DOCX, TXT or Markdown, up to 15 MB. We extract the text so classmates can preview it, then store the
					original privately.
				</p>

				<label class="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/40 bg-paper px-4 py-6 text-center transition hover:border-ink hover:bg-marigold-soft/40">
					<span class="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink bg-white">
						{#if uploading}<LoaderCircle size={18} class="animate-spin" />{:else}<Upload size={18} />{/if}
					</span>
					<span class="text-[0.8rem] font-bold">{uploading ? 'Reading the file…' : 'Choose a file or drag it here'}</span>
					<span class="text-[0.68rem] text-ink-soft">We will prefill the body if it is empty.</span>
					<input type="file" name="file" accept=".pdf,.docx,.txt,.md,.markdown" class="sr-only" onchange={onFileChange} />
				</label>

				{#if extractError}
					<div class="mt-3 flex items-start gap-2 rounded-lg border border-[#B42318] bg-[#FFF1EF] p-2.5 text-[0.75rem] font-semibold text-[#8f1c12]">
						<AlertCircle size={14} class="mt-0.5 shrink-0" /> {extractError}
					</div>
				{/if}

				{#if extracted}
					<div class="mt-3 flex items-start gap-2 rounded-lg border-2 border-[#1C7A50] bg-[#EFFBF3] p-3">
						<CheckCircle2 size={16} class="mt-0.5 shrink-0 text-[#155c3c]" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[0.78rem] font-bold text-[#155c3c]">{extracted.fileName}</p>
							<p class="text-[0.7rem] text-[#2b6b4f]">{extracted.words} words read. Review the prefilled body before submitting.</p>
						</div>
						<button type="button" class="btn btn-ghost btn-icon btn-sm !min-h-7 !w-7" aria-label="Clear attachment" onclick={clearFile}><X size={14} /></button>
					</div>
				{/if}
			</section>
		</div>

		<aside class="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
			<section class="card p-4">
				<h2 class="flex items-center gap-2 font-display text-lg font-extrabold"><ShieldCheck size={17} /> 4. Visibility & submit</h2>

				<fieldset class="mt-3 flex flex-col gap-2.5">
					<legend class="label">Visibility *</legend>
					<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border-2 border-ink/30 bg-paper p-3 transition has-[:checked]:border-ink has-[:checked]:bg-marigold-soft">
						<input type="radio" name="visibility" value="community" checked={val('visibility', data.revision?.visibility ?? 'community') === 'community'} class="mt-0.5 h-4 w-4 accent-[#211D31]" />
						<span>
							<span class="flex items-center gap-1.5 text-[0.8rem] font-bold">
								<span>🌐 Community-wide</span>
								<span class="chip chip-soft !min-h-5 !text-[0.58rem]">All departments</span>
							</span>
							<span class="mt-0.5 block text-[0.68rem] leading-snug text-ink-soft">
								Visible to all university students across all departments in Community Notes.
							</span>
						</span>
					</label>
					<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border-2 border-ink/30 bg-paper p-3 transition has-[:checked]:border-ink has-[:checked]:bg-marigold-soft">
						<input type="radio" name="visibility" value="department" checked={val('visibility', data.revision?.visibility ?? 'community') === 'department'} class="mt-0.5 h-4 w-4 accent-[#211D31]" />
						<span>
							<span class="flex items-center gap-1.5 text-[0.8rem] font-bold">
								<span>🔒 Department only</span>
								<span class="chip chip-soft !min-h-5 !text-[0.58rem]">
									{data.enrolledDepartment?.short_name ?? 'Your department'}
								</span>
							</span>
							<span class="mt-0.5 block text-[0.68rem] leading-snug text-ink-soft">
								Confined strictly to students enrolled in {data.enrolledDepartment?.name ?? 'your department'}.
							</span>
						</span>
					</label>
				</fieldset>

				<div class="mt-4 rounded-lg border border-ink/20 bg-paper p-2.5">
					<p class="flex items-start gap-1.5 text-[0.7rem] leading-relaxed text-ink-soft">
						<Info size={13} class="mt-0.5 shrink-0" />
						Submissions start as <strong class="text-ink">Community Submitted</strong>. A moderator checks them before they become
						<strong class="text-ink">Community Verified</strong>.
					</p>
				</div>

				<button type="submit" class="btn btn-primary btn-lg mt-4 w-full" disabled={submitting || uploading}>
					{#if submitting}
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
						Submitting…
					{:else}
						<FileText size={17} />
						{data.revision ? 'Submit revision' : 'Submit note for review'}
					{/if}
				</button>
			</section>

			<section class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.8rem] font-bold"><Lightbulb size={15} /> What makes a good note?</p>
				<ul class="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[0.72rem] leading-relaxed text-ink-soft">
					<li>Lead with the idea, not your personal story.</li>
					<li>Show a worked example and the common mistake.</li>
					<li>Credit the book, lecture or classmate you learned it from.</li>
					<li>Do not upload exams you were told to keep private.</li>
				</ul>
			</section>
		</aside>
	</form>
</div>
