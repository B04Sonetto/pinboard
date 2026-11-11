<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import {
		AlertCircle,
		BookOpenCheck,
		CheckCircle2,
		ClipboardList,
		FileQuestion,
		Hash,
		Lightbulb,
		ListChecks,
		LoaderCircle,
		Search,
		Sparkles,
		StickyNote,
		Wand2,
		X
	} from '@lucide/svelte';
	import { formatDate, studyKindLabel } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let kind = $state<'reviewer' | 'summary' | 'quiz' | 'keywords'>('reviewer');
	let difficulty = $state<'easy' | 'standard' | 'challenge'>('standard');
	let department = $state(untrack(() => data.preset.department));
	let subject = $state(untrack(() => data.preset.subject));
	let topic = $state(untrack(() => data.preset.topic));
	let search = $state('');
	let selected = $state<string[]>(untrack(() => [...data.preset.notes]));
	let ownNotes = $state('');
	let submitting = $state(false);

	const kinds = [
		{ id: 'reviewer', label: 'Study reviewer', icon: ClipboardList, text: 'Structured key points, terms and self-checks.' },
		{ id: 'summary', label: 'Lesson summary', icon: BookOpenCheck, text: 'A tighter read of the main ideas across notes.' },
		{ id: 'quiz', label: 'Practice quiz', icon: FileQuestion, text: 'Multiple choice and true/false recall with answers.' },
		{ id: 'keywords', label: 'Keyword list', icon: Hash, text: 'Ranked terms with space to write definitions.' }
	] as const;

	const subjects = $derived(
		data.taxonomy.subjects.filter((item) => !department || item.department_id === department)
	);
	const topics = $derived(
		data.taxonomy.topics.filter(
			(item) => (!subject || item.subject_id === subject) && (!department || subjects.some((s) => s.id === item.subject_id))
		)
	);
	const visibleNotes = $derived(
		data.notes.filter((note) => {
			if (department && note.department_id !== department) return false;
			if (subject && note.subject_id !== subject) return false;
			if (topic && note.topic_id !== topic) return false;
			if (search.trim()) {
				const needle = search.toLowerCase();
				if (
					!note.title.toLowerCase().includes(needle) &&
					!note.summary.toLowerCase().includes(needle) &&
					!note.subject?.code.toLowerCase().includes(needle) &&
					!note.topic?.name.toLowerCase().includes(needle)
				)
					return false;
			}
			return true;
		})
	);
	const selectedNotes = $derived(
		selected.map((id) => data.notes.find((note) => note.id === id)).filter((note): note is (typeof data.notes)[number] => Boolean(note))
	);

	function onDepartmentChange() {
		subject = '';
		topic = '';
	}
	function onSubjectChange() {
		topic = '';
	}
	function selectVisible() {
		selected = [...new Set([...selected, ...visibleNotes.map((note) => note.id)])].slice(0, 8);
	}
	function clearSelected() {
		selected = [];
	}
	function removeSelected(id: string) {
		selected = selected.filter((item) => item !== id);
	}
</script>

<svelte:head><title>AI Study Assistant · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="AI study assistant"
		title="Turn notes into study material"
		description="Choose the notes you trust, add your own context, and generate a reviewer, summary, keyword list or practice quiz. Nothing is generated from thin air — every output is assembled from the sources you pick."
	>
		<a href="/study/history" class="btn btn-secondary">Generation history</a>
	</PageHeader>

	<div class="flex items-start gap-2 rounded-xl border-2 border-ink bg-[#F4F0FF] px-4 py-3">
		<Sparkles size={17} class="mt-0.5 shrink-0 text-violet" />
		<p class="text-[0.8rem] leading-relaxed text-ink-soft">
			<strong class="text-ink">How this works:</strong> the assistant uses an extractive engine on your selected notes. It
			does not browse the web or invent sources. Outputs are labeled <strong class="text-violet">AI Generated</strong> and
			should be checked against your class discussion.
		</p>
	</div>

	{#if data.error}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm text-[#8f1c12]">{data.error}</div>
	{/if}
	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {form.error}
		</div>
	{/if}

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
		<form
			method="POST"
			action="?/generate"
			class="flex min-w-0 flex-col gap-5"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<section class="card p-4 sm:p-5">
				<div class="flex items-center gap-2">
					<span class="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-marigold font-mono text-[0.7rem] font-bold">1</span>
					<h2 class="font-display text-lg font-extrabold">What should we build?</h2>
				</div>
				<div class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each kinds as option (option.id)}
						<label
							class="flex cursor-pointer items-start gap-2.5 rounded-xl border-2 border-ink/25 bg-paper p-3 transition has-[:checked]:border-ink has-[:checked]:bg-marigold-soft has-[:checked]:shadow-[3px_3px_0_#211D31]"
						>
							<input type="radio" name="kind" value={option.id} bind:group={kind} class="mt-1 h-4 w-4 accent-[#211D31]" />
							<span class="min-w-0">
								<span class="flex items-center gap-1.5 text-[0.82rem] font-bold"><option.icon size={15} /> {option.label}</span>
								<span class="mt-0.5 block text-[0.7rem] leading-snug text-ink-soft">{option.text}</span>
							</span>
						</label>
					{/each}
				</div>
			</section>

			<section class="card p-4 sm:p-5">
				<div class="flex items-center gap-2">
					<span class="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-[#BFE0FF] font-mono text-[0.7rem] font-bold">2</span>
					<h2 class="font-display text-lg font-extrabold">Choose your source notes</h2>
					<span class="ml-auto chip chip-soft !min-h-6 !text-[0.66rem]">{selected.length} / 8 selected</span>
				</div>

				<div class="mt-3 grid gap-2 sm:grid-cols-3">
					<label class="flex flex-col">
						<span class="label">Department</span>
						<select class="select" name="department_id" bind:value={department} onchange={onDepartmentChange}>
							<option value="">Any department</option>
							{#each data.taxonomy.departments as item (item.id)}
								<option value={item.id}>{item.short_name} · {item.name}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col">
						<span class="label">Subject</span>
						<select class="select" name="subject_id" bind:value={subject} onchange={onSubjectChange}>
							<option value="">Any subject</option>
							{#each subjects as item (item.id)}
								<option value={item.id}>{item.code} · {item.name}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col">
						<span class="label">Topic</span>
						<select class="select" name="topic_id" bind:value={topic}>
							<option value="">Any topic</option>
							{#each topics as item (item.id)}
								<option value={item.id}>{item.name}</option>
							{/each}
						</select>
					</label>
				</div>

				<label class="relative mt-3 block">
					<span class="sr-only">Search source notes</span>
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input class="input !pl-9" type="search" bind:value={search} placeholder="Filter by title, subject code or topic…" />
				</label>

				<div class="mt-2 flex items-center justify-between text-[0.68rem]">
					<span class="text-ink-soft">{visibleNotes.length} notes shown</span>
					<span class="flex gap-2">
						<button type="button" class="font-bold text-violet hover:underline" onclick={selectVisible}>Select visible</button>
						{#if selected.length}<button type="button" class="font-bold text-ink-soft hover:underline" onclick={clearSelected}>Clear all</button>{/if}
					</span>
				</div>

				<div class="scroll-thin mt-2 max-h-[21rem] overflow-y-auto rounded-xl border-2 border-ink bg-paper">
					{#if visibleNotes.length}
						{#each visibleNotes as note, index (note.id)}
							<label class="flex cursor-pointer items-start gap-2.5 border-b border-dashed border-ink/15 p-3 transition last:border-0 hover:bg-marigold-soft/40 has-[:checked]:bg-marigold-soft/60">
								<input type="checkbox" name="note_ids" value={note.id} bind:group={selected} class="mt-0.5 h-4 w-4 shrink-0 accent-[#211D31]" />
								<span class="min-w-0 flex-1">
									<span class="flex items-center gap-1.5 font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">
										{note.subject?.code ?? 'Note'} {#if note.topic}<span>· {note.topic.name}</span>{/if}
									</span>
									<span class="mt-0.5 block text-[0.8rem] font-bold leading-snug">{note.title}</span>
									<span class="mt-0.5 line-clamp-1 block text-[0.68rem] text-ink-soft">{note.summary}</span>
								</span>
								<span class="shrink-0 font-mono text-[0.58rem] text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
							</label>
						{/each}
					{:else}
						<div class="p-6 text-center">
							<p class="text-sm font-bold">No notes match those filters</p>
							<p class="mt-1 text-[0.75rem] text-ink-soft">Try another subject or clear the search.</p>
						</div>
					{/if}
				</div>

				{#if selectedNotes.length}
					<div class="mt-3">
						<p class="label">Selected sources</p>
						<div class="flex flex-wrap gap-1.5">
							{#each selectedNotes as note (note.id)}
								<span class="chip !min-h-6 !text-[0.66rem]">
									{note.title.length > 42 ? note.title.slice(0, 42) + '…' : note.title}
									<button type="button" class="ml-0.5 rounded-full p-0.5 hover:bg-white/60" aria-label="Remove {note.title}" onclick={() => removeSelected(note.id)}>
										<X size={11} />
									</button>
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</section>

			<section class="card p-4 sm:p-5">
				<div class="flex items-center gap-2">
					<span class="flex h-7 w-7 items-center justify-center rounded border-2 border-ink bg-[#BDEBCB] font-mono text-[0.7rem] font-bold">3</span>
					<h2 class="font-display text-lg font-extrabold">Add your own context</h2>
				</div>
				<p class="mt-1 text-[0.76rem] leading-relaxed text-ink-soft">
					Paste notes from the lecture, a correction from your instructor, or anything the community notes missed.
				</p>

				<div class="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
					<label class="flex flex-col">
						<span class="label">Attached notes (optional)</span>
						<textarea class="textarea min-h-[7rem]" name="own_notes" rows="5" bind:value={ownNotes} placeholder="Paste your own notes here. They are used only for this generation."></textarea>
					</label>
					<div class="flex flex-col gap-3">
						<label class="flex flex-col">
							<span class="label">Focus terms (optional)</span>
							<input class="input" type="text" name="focus" placeholder="e.g. 3NF, anomalies" />
						</label>
						{#if kind === 'quiz'}
							<label class="flex flex-col">
								<span class="label">Questions</span>
								<select class="select" name="question_count">
									{#each [5, 8, 10, 12, 15] as count (count)}
										<option value={String(count)} selected={count === 8}>{count} questions</option>
									{/each}
								</select>
							</label>
						{:else}
							<input type="hidden" name="question_count" value="8" />
						{/if}
						<label class="flex flex-col">
							<span class="label">Depth</span>
							<select class="select" name="difficulty" bind:value={difficulty}>
								<option value="easy">Foundation</option>
								<option value="standard">Standard</option>
								<option value="challenge">Challenge</option>
							</select>
							<span class="hint mt-1">Challenge pulls longer, denser passages.</span>
						</label>
					</div>
				</div>
			</section>

			<div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
				<p class="flex items-center gap-1.5 text-[0.7rem] text-ink-soft">
					<Lightbulb size={13} /> Outputs are saved to your generation history.
				</p>
				<button type="submit" class="btn btn-primary btn-lg" disabled={submitting || selected.length === 0}>
					{#if submitting}
						<LoaderCircle size={17} class="animate-spin" /> Building your material…
					{:else}
						<Wand2 size={17} /> Generate {studyKindLabel(kind).toLowerCase()}
					{/if}
				</button>
			</div>
		</form>

		<aside class="flex flex-col gap-4">
			<section class="card overflow-hidden">
				<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F4F0FF] px-4 py-2.5">
					<Sparkles size={16} class="text-violet" />
					<h2 class="font-display text-base font-extrabold">Recent generations</h2>
				</div>
				{#if data.recent.length}
					<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
						{#each data.recent as generation (generation.id)}
							<li>
								<a href="/study/{generation.id}" class="block px-4 py-2.5 hover:bg-paper-deep/60">
									<span class="flex items-center gap-1.5">
										<span class="badge badge-ai !px-1 !py-0 !text-[0.52rem]">AI</span>
										<span class="font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">{studyKindLabel(generation.kind)}</span>
									</span>
									<span class="mt-1 block text-[0.77rem] font-bold leading-snug">{generation.title}</span>
									<span class="block text-[0.64rem] text-ink-faint">
										{generation.subject?.code ?? ''} · {formatDate(generation.created_at)}
									</span>
								</a>
							</li>
						{/each}
					</ul>
					<a href="/study/history" class="flex items-center justify-between border-t-2 border-ink px-4 py-2.5 text-[0.72rem] font-bold hover:bg-paper-deep">View all history →</a>
				{:else}
					<div class="p-4 text-center">
						<StickyNote size={22} class="mx-auto text-ink-faint" />
						<p class="mt-2 text-sm font-bold">Nothing generated yet</p>
						<p class="mt-1 text-[0.72rem] text-ink-soft">Your reviewers and quizzes will appear here.</p>
					</div>
				{/if}
			</section>

			<section class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.8rem] font-bold"><ListChecks size={15} /> Get better output</p>
				<ul class="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-[0.72rem] leading-relaxed text-ink-soft">
					<li>Pick 2–4 focused notes instead of an entire subject.</li>
					<li>Add your instructor's corrections in attached notes.</li>
					<li>Use the focus field for the exact exam topic.</li>
					<li>Take the quiz twice; review only the misses.</li>
				</ul>
			</section>

			<div class="rounded-xl border-2 border-ink bg-paper-card p-4">
				<p class="flex items-center gap-1.5 text-[0.78rem] font-bold"><CheckCircle2 size={15} /> Your sources stay yours</p>
				<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
					Generations are private to your account. Source notes are stored as references so you can trace every claim.
				</p>
			</div>
		</aside>
	</div>
</div>
