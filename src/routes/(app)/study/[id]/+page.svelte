<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Markdown from '$lib/components/Markdown.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import {
		AlertTriangle,
		ArrowLeft,
		BookOpenCheck,
		CheckCircle2,
		ClipboardList,
		Download,
		FileQuestion,
		Hash,
		History,
		Layers,
		Printer,
		RotateCcw,
		Sparkles,
		Target,
		Trash2,
		Wand2
	} from '@lucide/svelte';
	import { formatDate, studyDifficultyLabel, studyKindLabel } from '$lib/utils';
	import type { StudyDifficulty } from '$lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const generation = $derived(data.generation);
	const payload = $derived(data.payload);
	const isQuiz = $derived(generation.kind === 'quiz' && (payload.questions?.length ?? 0) > 0);
	const difficulty = $derived(
		typeof payload.options?.difficulty === 'string'
			? studyDifficultyLabel(payload.options.difficulty as StudyDifficulty)
			: 'Standard'
	);

	const KindIcon = $derived(
		generation.kind === 'reviewer'
			? ClipboardList
			: generation.kind === 'summary'
				? BookOpenCheck
				: generation.kind === 'quiz'
					? FileQuestion
					: Hash
	);

	const regenerateHref = $derived(
		`/study?${new URLSearchParams({
			...(generation.subject_id ? { subject: generation.subject_id } : {}),
			...(generation.topic_id ? { topic: generation.topic_id } : {}),
			...(generation.source_note_ids?.length ? { notes: generation.source_note_ids.join(',') } : {})
		}).toString()}`
	);

	const terms = $derived(payload.keywords?.slice(0, 18) ?? []);

	function percent(score: number, total: number) {
		if (!total) return 0;
		return Math.round((score / total) * 100);
	}
</script>

<svelte:head>
	<title>{generation.title} · Pinboard</title>
	<meta name="description" content="AI-generated study material built from community notes on Pinboard." />
</svelte:head>

<div class="flex flex-col gap-5">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft" aria-label="Breadcrumb">
		<a href="/study" class="hover:text-ink hover:underline">AI Study Assistant</a>
		<span class="text-ink-faint">/</span>
		<a href="/study/history" class="hover:text-ink hover:underline">History</a>
		<span class="text-ink-faint">/</span>
		<span class="truncate text-ink">{generation.title}</span>
	</nav>

	{#if form && 'error' in form && form.error}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			{form.error}
		</div>
	{/if}

	<header class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<span class="badge badge-ai"><span aria-hidden="true">✦</span> AI Generated</span>
			<span class="badge badge-neutral">{studyKindLabel(generation.kind)}</span>
			{#if generation.subject}<a href="/courses/{generation.subject.id}" class="chip !min-h-6 !text-[0.66rem] hover:bg-marigold">{generation.subject.code}</a>{/if}
			{#if generation.topic}<span class="chip chip-soft !min-h-6 !text-[0.66rem]">{generation.topic.name}</span>{/if}
		</div>
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
			<div class="min-w-0">
				<h1 class="display max-w-4xl text-[1.9rem] leading-[1.06] sm:text-[2.5rem]">{generation.title}</h1>
				<p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] text-ink-soft">
					<span class="flex items-center gap-1.5"><KindIcon size={14} /> {studyKindLabel(generation.kind)}</span>
					<span>Generated {formatDate(generation.created_at)}</span>
					<span>{data.sources.length} source {data.sources.length === 1 ? 'note' : 'notes'}</span>
					<span>{difficulty} depth</span>
					{#if isQuiz}<span>{data.questionCount} questions</span>{/if}
				</p>
			</div>
			<div class="flex flex-wrap gap-2 no-print">
				{#if isQuiz}
					<a href="/study/{generation.id}/quiz" class="btn btn-primary"><Target size={16} /> Take the quiz</a>
					{#if payload.flashcards?.length}
						<a href="/study/{generation.id}/flashcards" class="btn btn-secondary"><Layers size={16} /> Flashcards</a>
					{/if}
				{/if}
				<button type="button" class="btn btn-secondary" onclick={() => window.print()}><Printer size={16} /> Print</button>
				<a href="/api/study/{generation.id}" class="btn btn-secondary"><Download size={16} /> Download .md</a>
			</div>
		</div>
	</header>

	<div class="flex items-start gap-2 rounded-xl border-2 border-violet/40 bg-[#F4F0FF] px-4 py-3">
		<Sparkles size={17} class="mt-0.5 shrink-0 text-violet" />
		<p class="text-[0.78rem] leading-relaxed text-ink-soft">
			<strong class="text-ink">Machine-generated study aid.</strong> This material was assembled from the community notes listed
			below. It can miss context, simplify wording, or repeat an error in a source. Check it against your instructor's
			discussion before relying on it.
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
		<article class="min-w-0">
			<div class="note-sheet px-5 py-6 sm:px-8 sm:py-8">
				<span class="absolute right-5 top-0 h-3 w-16 -translate-y-1/2 rotate-[-4deg] bg-[#E4D9FF]/90" aria-hidden="true"></span>
				<Markdown content={generation.content} />
			</div>

			{#if isQuiz}
				<section class="card mt-5 overflow-hidden">
					<div class="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p class="kicker !text-[0.6rem]">Active recall</p>
							<h2 class="mt-1 font-display text-lg font-extrabold">Test yourself on this material</h2>
							<p class="mt-1 max-w-lg text-[0.78rem] leading-relaxed text-ink-soft">
								{data.questionCount} multiple-choice and true/false items. Your score is saved to quiz history so you can see
								progress.
							</p>
						</div>
						<a href="/study/{generation.id}/quiz" class="btn btn-primary shrink-0"><Target size={16} /> Start quiz</a>
					</div>
					{#if data.attempts.length}
						<div class="border-t-2 border-ink bg-[#F3EDDD] px-5 py-3">
							<p class="font-mono text-[0.58rem] uppercase tracking-[0.08em] text-ink-soft">Best score so far</p>
							<div class="mt-1.5 flex items-center gap-3">
								<span class="stat-value !text-2xl">{data.bestPercent}%</span>
								<div class="h-2.5 w-full max-w-xs overflow-hidden rounded-full border-2 border-ink bg-paper">
									<div class="h-full bg-leaf" style="width: {data.bestPercent}%"></div>
								</div>
							</div>
						</div>
					{/if}
				</section>
			{/if}

			{#if terms.length}
				<section class="mt-5 rounded-xl border-2 border-ink bg-paper-card p-4">
					<p class="kicker !text-[0.6rem]">Terms in this material</p>
					<div class="mt-2 flex flex-wrap gap-1.5">
						{#each terms as keyword (keyword.term)}
							<span class="chip chip-soft !min-h-6 !text-[0.68rem]" title="{keyword.count} appearances">
								{keyword.term}
							</span>
						{/each}
					</div>
				</section>
			{/if}
		</article>

		<aside class="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
			<section class="card overflow-hidden">
				<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F4F0FF] px-4 py-2.5">
					<Sparkles size={16} class="text-violet" />
					<h2 class="font-display text-base font-extrabold">Built from</h2>
					<span class="ml-auto font-mono text-[0.6rem] text-violet">{data.sources.length}</span>
				</div>
				{#if data.sources.length}
					<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
						{#each data.sources as source (source.id)}
							<li>
								<a href="/notes/{source.id}" class="block px-4 py-3 hover:bg-paper-deep/60">
									<span class="flex items-center gap-1.5">
										<Badge status={source.status} compact />
									</span>
									<span class="mt-1 block text-[0.78rem] font-bold leading-snug">{source.title}</span>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="p-4 text-[0.75rem] leading-relaxed text-ink-soft">The original source notes are no longer available.</p>
				{/if}
			</section>

			{#if isQuiz}
				<section class="card overflow-hidden">
					<div class="flex items-center gap-2 border-b-2 border-ink bg-paper-deep px-4 py-2.5">
						<History size={16} />
						<h2 class="font-display text-base font-extrabold">Attempts</h2>
					</div>
					{#if data.attempts.length}
						<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
							{#each data.attempts as attempt (attempt.id)}
								{@const score = percent(attempt.score, attempt.total)}
								<li class="flex items-center justify-between gap-2 px-4 py-2.5">
									<span class="text-[0.7rem] text-ink-soft">{formatDate(attempt.created_at)}</span>
									<span class="flex items-center gap-2">
										<span class="font-mono text-[0.62rem] text-ink-faint">{attempt.score}/{attempt.total}</span>
										<span
											class="badge {score >= 80 ? 'badge-verified' : score >= 50 ? 'badge-submitted' : 'badge-rejected'} !text-[0.55rem]"
										>
											{score}%
										</span>
									</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="p-4 text-[0.75rem] leading-relaxed text-ink-soft">No attempts yet. Take the quiz to start tracking your recall.</p>
					{/if}
				</section>
			{/if}

			<div class="card p-4">
				<p class="kicker !text-[0.6rem]">Study next</p>
				<div class="mt-2 flex flex-col gap-2">
					<a href={regenerateHref} class="btn btn-secondary btn-sm"><RotateCcw size={14} /> Regenerate with these notes</a>
					<a href="/study" class="btn btn-primary btn-sm"><Wand2 size={14} /> Build something new</a>
				</div>
			</div>

			<div class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.78rem] font-bold"><CheckCircle2 size={15} /> Private to your account</p>
				<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
					This generation and its quiz attempts are visible only to you. Source notes keep their own community labels.
				</p>
			</div>

			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm('Delete this generated study material and its quiz attempts?')) {
						cancel();
						return;
					}
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<button type="submit" class="btn btn-ghost btn-sm w-full !text-[#B42318]"><Trash2 size={14} /> Delete generation</button>
			</form>

			<a href="/study/history" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to history</a>
		</aside>
	</div>

	<div class="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/30 px-4 py-3">
		<AlertTriangle size={16} class="mt-0.5 shrink-0 text-ink-soft" />
		<p class="text-[0.7rem] leading-relaxed text-ink-soft">
			Pinboard study material is not official university content. For graded work, follow the references and instructions
			given in your course.
		</p>
	</div>
</div>
