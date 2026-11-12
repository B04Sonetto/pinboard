<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Markdown from '$lib/components/Markdown.svelte';
	import {
		AlertCircle,
		CheckCircle2,
		FileText,
		Globe,
		Info,
		Lightbulb,
		LoaderCircle,
		Lock,
		Paperclip,
		Sparkles,
		Upload,
		X
	} from '@lucide/svelte';
	import { DEFAULT_NOTE_COLOR, wordCount } from '$lib/utils';

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
	const departmentSubjects = $derived(
		data.taxonomy.subjects.filter((item) => item.department_id === department)
	);
	const subjects = $derived.by(() => {
		if (!program) return departmentSubjects;
		const programSubjects = departmentSubjects.filter((item) => item.program_id === program);
		return programSubjects.length ? programSubjects : departmentSubjects;
	});
	const usingDepartmentFallback = $derived(
		Boolean(
			program &&
				departmentSubjects.length > 0 &&
				!departmentSubjects.some((item) => item.program_id === program)
		)
	);
	const catalogMissing = $derived(
		data.taxonomy.departments.length === 0 || data.taxonomy.subjects.length === 0
	);
	const topics = $derived(data.taxonomy.topics.filter((item) => item.subject_id === subject));
	let contentText = $state(untrack(() => val('content', data.revision?.content ?? '')));
	const contentValue = $derived(contentText);
	const visibilityValue = $derived(val('visibility', data.revision?.visibility ?? 'community'));
	const departmentColor = $derived(data.enrolledDepartment?.color || DEFAULT_NOTE_COLOR);

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

<svelte:head><title>{data.revision ? 'Revise your note' : 'Write a note'} · Pinboard</title></svelte:head>

{#snippet property(label: string, id: string)}
	<label for={id} class="text-sm font-medium text-ink-soft">{label}</label>
{/snippet}

<form
	method="POST"
	enctype="multipart/form-data"
	class="flex flex-col gap-6"
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
	{#if data.revision}
		<input type="hidden" name="revision_of" value={data.revision.id} />
	{/if}

	<!-- Breadcrumb + actions -->
	<div
		class="sticky top-[75px] z-30 -mx-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-[2.5px] border-ink bg-paper-card px-4 py-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
	>
		<nav aria-label="Breadcrumb" class="flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
			<a href="/notes" class="font-medium text-ink-soft hover:text-ink hover:underline">Community Notes</a>
			<span aria-hidden="true" class="text-ink-faint">/</span>
			{#if data.enrolledDepartment}
				<span class="inline-flex items-center gap-1.5 font-medium text-ink-soft">
					<Lock size={13} aria-hidden="true" />
					{data.enrolledDepartment.name}
				</span>
				<span aria-hidden="true" class="text-ink-faint">/</span>
			{/if}
			<span class="font-bold">{data.revision ? 'Revision' : 'New note'}</span>
		</nav>

		<div class="flex flex-wrap items-center gap-2.5">
			<a href="/notes" class="btn btn-secondary btn-sm">Cancel</a>
			<button type="submit" class="btn btn-primary btn-sm" disabled={submitting || uploading}>
				{#if submitting}
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
					Submitting…
				{:else}
					<FileText size={16} aria-hidden="true" />
					{data.revision ? 'Submit revision' : 'Submit for review'}
				{/if}
			</button>
		</div>
	</div>

	{#if data.revision}
		<div class="rounded-lg border-[2.5px] border-ink bg-marigold-soft p-4">
			<p class="flex items-center gap-2 text-sm font-bold"><Sparkles size={16} /> Revising: {data.revision.title}</p>
			<p class="mt-1 text-sm leading-relaxed text-ink-mid">
				This creates a fresh submission. The original note stays as-is until a moderator reviews the revision.
			</p>
		</div>
	{/if}

	{#if catalogMissing}
		<div class="rounded-lg border-[2.5px] border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm leading-relaxed text-[#8f1c12]" role="alert">
			<strong>The subject catalog did not load.</strong> Notes need a department and subject before they can be saved. Ask a
			moderator to run <code>supabase/setup.sql</code> and <code>supabase/seed.sql</code>, then refresh this page. You can
			still <a href="/suggestions" class="underline">suggest a subject</a> in the meantime.
		</div>
	{/if}

	{#if form && 'error' in form && form.error}
		<div
			class="flex items-start gap-2 rounded-lg border-[2.5px] border-danger bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-danger"
			role="alert"
		>
			<AlertCircle size={17} class="mt-0.5 shrink-0" />
			{form.error}
		</div>
	{/if}

	<div class="grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">
		<!-- The note sheet -->
		<div class="relative min-w-0 rounded-md border-[3px] border-ink bg-white px-5 pb-10 pt-12 shadow-[6px_6px_0_var(--color-ink)] sm:px-10 sm:pt-14 lg:px-14">
			<span class="pin !-top-3" style="--pin-color:#e5484d" aria-hidden="true"></span>

			<label class="sr-only" for="note-title">Title</label>
			<input
				id="note-title"
				class="mb-5 w-full border-0 border-b-[3px] border-dashed border-transparent bg-transparent pb-1 font-display text-[2rem] font-extrabold leading-[1.1] tracking-[-0.025em] outline-none transition placeholder:text-ink/30 focus:border-ink/30 sm:text-[2.875rem]"
				type="text"
				name="title"
				required
				minlength="4"
				maxlength="200"
				placeholder="Untitled note"
				value={val('title', data.revision?.title ?? '')}
			/>

			<!-- Properties -->
			<section
				aria-label="Note properties"
				class="mb-8 grid grid-cols-1 items-center gap-x-2 gap-y-1 border-b-[2.5px] border-dashed border-[#cfc6b0] pb-6 sm:grid-cols-[140px_minmax(0,1fr)]"
			>
				<span class="text-sm font-medium text-ink-soft sm:py-2">Department</span>
				{#if data.enrolledDepartment}
					<div
						class="inline-flex min-h-[34px] items-center gap-2 justify-self-start rounded-md border-2 border-ink px-2.5 text-sm font-bold"
						style="background:{departmentColor}"
					>
						<Lock size={13} strokeWidth={2.4} aria-hidden="true" />
						{data.enrolledDepartment.name}
						<span class="text-xs font-medium text-ink-mid">from your enrollment</span>
						<input type="hidden" name="department_id" value={data.enrolledDepartment.id} />
					</div>
				{:else}
					<select
						id="note-department"
						class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
						name="department_id"
						required
						aria-label="Your enrolled department"
						bind:value={department}
						onchange={onDepartmentChange}
					>
						<option value="">Choose your department</option>
						{#each data.taxonomy.departments as item (item.id)}
							<option value={item.id}>{item.short_name} · {item.name}</option>
						{/each}
					</select>
				{/if}

				{@render property('Course', 'note-program')}
				<select
					id="note-program"
					class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
					name="program_id"
					bind:value={program}
					onchange={onProgramChange}
					disabled={!department}
				>
					<option value="">Not course-specific</option>
					{#each programs as item (item.id)}
						<option value={item.id}>{item.code} · {item.name}</option>
					{/each}
				</select>

				{@render property('Subject *', 'note-subject')}
				<div class="flex flex-col">
					<select
						id="note-subject"
						class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
						name="subject_id"
						required
						bind:value={subject}
						onchange={onSubjectChange}
						disabled={!department}
					>
						<option value="">Choose a subject</option>
						{#each subjects as item (item.id)}
							<option value={item.id}>{item.code} · {item.name}</option>
						{/each}
					</select>
					{#if usingDepartmentFallback}
						<span class="hint mt-1">
							No subjects are listed for this course yet, so every subject in your department is shown.
						</span>
					{/if}
					{#if department && subjects.length === 0}
						<span class="hint mt-1">
							No subjects listed yet for this department. <a href="/suggestions" class="link">Suggest one</a>.
						</span>
					{/if}
				</div>

				{@render property('Topic', 'note-topic')}
				<select
					id="note-topic"
					class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
					name="topic_id"
					bind:value={topic}
					disabled={!subject}
				>
					<option value="">General / no specific topic</option>
					{#each topics as item (item.id)}
						<option value={item.id}>{item.name}</option>
					{/each}
				</select>

				{@render property('Year level', 'note-year')}
				<select
					id="note-year"
					class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
					name="year_level"
					bind:value={yearLevel}
				>
					<option value="">Not specified</option>
					{#each [1, 2, 3, 4, 5, 6] as year (year)}
						<option value={String(year)}>Year {year}</option>
					{/each}
				</select>

				{@render property('Semester', 'note-semester')}
				<select
					id="note-semester"
					class="select !min-h-9 max-w-[340px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
					name="semester"
					bind:value={semester}
				>
					<option value="">Not specified</option>
					<option value="1">1st Semester</option>
					<option value="2">2nd Semester</option>
				</select>

				<span class="mt-2 text-sm font-medium text-ink-soft sm:py-2" id="visibility-label">Visibility</span>
				<fieldset class="mt-2 flex flex-wrap gap-2" aria-labelledby="visibility-label">
					<label class="cursor-pointer">
						<input
							type="radio"
							name="visibility"
							value="community"
							class="peer sr-only"
							checked={visibilityValue === 'community'}
						/>
						<span
							class="inline-flex min-h-10 items-center gap-2 rounded-lg border-[2.5px] border-ink bg-white px-3.5 text-sm font-bold transition hover:bg-paper-card peer-checked:bg-marigold peer-checked:shadow-[3px_3px_0_var(--color-ink)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
						>
							<Globe size={15} strokeWidth={2.2} aria-hidden="true" /> Community
						</span>
					</label>
					<label class="cursor-pointer">
						<input
							type="radio"
							name="visibility"
							value="department"
							class="peer sr-only"
							checked={visibilityValue === 'department'}
						/>
						<span
							class="inline-flex min-h-10 items-center gap-2 rounded-lg border-[2.5px] border-ink bg-white px-3.5 text-sm font-bold transition hover:bg-paper-card peer-checked:bg-marigold peer-checked:shadow-[3px_3px_0_var(--color-ink)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"
						>
							<Lock size={15} strokeWidth={2.2} aria-hidden="true" />
							{data.enrolledDepartment?.short_name ?? 'My department'} only
						</span>
					</label>
				</fieldset>
				<span class="hidden sm:block"></span>
				<p class="text-[0.8125rem] leading-relaxed text-ink-soft">
					Community notes appear on every department's Community board. Department-only notes stay with
					{data.enrolledDepartment?.name ?? 'your department'}. Notes can't be posted to another department's board.
				</p>

				{@render property('Keywords', 'note-keywords')}
				<div class="flex flex-col">
					<input
						id="note-keywords"
						class="input !min-h-9 max-w-[480px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
						type="text"
						name="keywords"
						placeholder="normalization, 1nf, functional dependency"
						value={val('keywords', data.revision?.keywords?.join(', ') ?? '')}
					/>
					<span class="hint mt-1">Comma-separated. Leave blank and we'll suggest keywords from your text.</span>
				</div>

				{@render property('Source link', 'note-source')}
				<div class="flex flex-col">
					<input
						id="note-source"
						class="input !min-h-9 max-w-[480px] !border-transparent !bg-[#f6f0e0] hover:!border-ink"
						type="url"
						name="source_url"
						inputmode="url"
						placeholder="https://your-course-site.edu/syllabus"
						value={val('source_url', data.revision?.source_url ?? '')}
					/>
					<span class="hint mt-1">
						Optional. Shown as provenance on the note, not as an official university endorsement.
					</span>
				</div>
			</section>

			<!-- Summary -->
			<div class="mb-8 flex flex-col">
				<label for="note-summary" class="label">Short summary *</label>
				<textarea
					id="note-summary"
					class="textarea !bg-[#f6f0e0] !border-transparent hover:!border-ink focus:!border-ink"
					name="summary"
					rows="2"
					required
					minlength="20"
					maxlength="600"
					placeholder="One or two sentences on what this note covers and who it helps."
				>{val('summary', data.revision?.summary ?? '')}</textarea>
			</div>

			<!-- Body -->
			<div class="flex flex-col">
				<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
					<label for="note-body" class="label !mb-0">Note body</label>
					<div class="flex items-center gap-1 rounded-lg border-2 border-ink bg-paper p-0.5" role="group" aria-label="Editor mode">
						<button
							type="button"
							class="tab !min-h-8 !px-2.5 !text-xs"
							class:is-active={tab === 'write'}
							aria-pressed={tab === 'write'}
							onclick={() => (tab = 'write')}>Write</button
						>
						<button
							type="button"
							class="tab !min-h-8 !px-2.5 !text-xs"
							class:is-active={tab === 'preview'}
							aria-pressed={tab === 'preview'}
							onclick={() => (tab = 'preview')}>Preview</button
						>
					</div>
				</div>

				{#if tab === 'write'}
					<textarea
						id="note-body"
						class="textarea min-h-[26rem] !border-2 font-mono !text-[0.875rem] !leading-[1.7]"
						name="content"
						rows="18"
						bind:value={contentText}
						placeholder={'# Heading\n\nStart with the big idea, then break it into sections.\n\n## Key points\n\n- First point\n- Second point'}
					></textarea>
					<div class="mt-1.5 flex items-center justify-between text-xs text-ink-soft">
						<span>{wordCount(contentValue)} words</span>
						<span>Markdown: # headings, lists, tables, code blocks</span>
					</div>
				{:else}
					<input type="hidden" name="content" value={contentValue} />
					<div class="min-h-[26rem] rounded-lg border-2 border-dashed border-ink/30 bg-white p-5">
						{#if contentValue.trim()}
							<Markdown content={contentValue} />
						{:else}
							<p class="text-sm text-ink-soft">Nothing to preview yet. Switch back to Write and start typing.</p>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Side column -->
		<aside class="flex flex-col gap-5 lg:sticky lg:top-[155px]">
			<section class="card p-4">
				<h2 class="flex items-center gap-2 font-display text-lg font-extrabold">
					<Paperclip size={17} aria-hidden="true" /> Attach a file
				</h2>
				<p class="mt-1 text-sm leading-relaxed text-ink-mid">
					Optional. PDF, DOCX, TXT or Markdown up to 15 MB. We read the text so classmates can preview it, and store the
					original privately.
				</p>

				<label
					class="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/50 bg-paper px-4 py-6 text-center transition hover:border-ink hover:bg-marigold-soft/50 focus-within:border-ink"
				>
					<span class="flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink bg-white">
						{#if uploading}<LoaderCircle size={18} class="animate-spin" />{:else}<Upload size={18} />{/if}
					</span>
					<span class="text-sm font-bold">{uploading ? 'Reading the file…' : 'Choose a file or drop it here'}</span>
					<span class="text-xs text-ink-soft">Fills the body if it's empty.</span>
					<input type="file" name="file" accept=".pdf,.docx,.txt,.md,.markdown" class="sr-only" onchange={onFileChange} />
				</label>

				{#if extractError}
					<div class="mt-3 flex items-start gap-2 rounded-lg border-2 border-danger bg-[#fff1ef] p-2.5 text-sm font-semibold text-danger" role="alert">
						<AlertCircle size={15} class="mt-0.5 shrink-0" />
						{extractError}
					</div>
				{/if}

				{#if extracted}
					<div class="mt-3 flex items-start gap-2 rounded-lg border-2 border-leaf-deep bg-leaf/40 p-3">
						<CheckCircle2 size={17} class="mt-0.5 shrink-0 text-leaf-deep" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-bold text-leaf-deep">{extracted.fileName}</p>
							<p class="text-xs text-ink-mid">{extracted.words} words read. Review the prefilled body before submitting.</p>
						</div>
						<button type="button" class="btn btn-ghost btn-icon btn-sm !min-h-8 !w-8" aria-label="Clear attachment" onclick={clearFile}>
							<X size={14} />
						</button>
					</div>
				{/if}
			</section>

			<section class="rounded-lg border-[2.5px] border-ink bg-paper-deep p-4">
				<p class="flex items-start gap-2 text-sm leading-relaxed text-ink-mid">
					<Info size={15} class="mt-1 shrink-0" aria-hidden="true" />
					<span>
						Submissions start as <strong class="text-ink">Community Submitted</strong>. A moderator checks them before they
						become <strong class="text-ink">Community Verified</strong>.
					</span>
				</p>
			</section>

			<section class="note-sheet !rounded-md !bg-butter p-4" style="transform:rotate(-1deg)">
				<span class="pin" style="--pin-color:#2f6fdb" aria-hidden="true"></span>
				<p class="mt-3 flex items-center gap-1.5 font-hand text-2xl leading-none"><Lightbulb size={18} aria-hidden="true" /> What makes a good note?</p>
				<ul class="mt-2.5 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
					<li>Lead with the idea, not your personal story.</li>
					<li>Show a worked example and the common mistake.</li>
					<li>Credit the book, lecture or classmate you learned it from.</li>
					<li>Don't upload exams you were told to keep private.</li>
				</ul>
			</section>
		</aside>
	</div>
</form>
