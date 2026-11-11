<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		BookOpenCheck,
		ClipboardList,
		FileQuestion,
		Hash,
		History,
		Search,
		Sparkles,
		Target,
		Wand2
	} from '@lucide/svelte';
	import { formatDate, studyKindLabel } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const kindIcons = {
		reviewer: ClipboardList,
		summary: BookOpenCheck,
		quiz: FileQuestion,
		keywords: Hash
	};

	const kinds = [
		{ value: '', label: 'All material' },
		{ value: 'reviewer', label: 'Reviewers' },
		{ value: 'summary', label: 'Summaries' },
		{ value: 'quiz', label: 'Quizzes' },
		{ value: 'keywords', label: 'Keywords' }
	];

	const activeKind = $derived(data.filters.kind);

	function best(attempts: { score: number; total: number }[]) {
		if (!attempts.length) return null;
		return Math.round(Math.max(...attempts.map((attempt) => (attempt.total ? attempt.score / attempt.total : 0))) * 100);
	}
</script>

<svelte:head><title>Generation history · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="AI study assistant"
		title="Your study material"
		description="Every reviewer, summary, quiz and keyword list you have generated. Materials are private to your account and keep links back to the community notes they came from."
	>
		<a href="/study" class="btn btn-primary"><Wand2 size={16} /> Generate new material</a>
	</PageHeader>

	<div class="grid gap-3 sm:grid-cols-3">
		<div class="card flex items-center gap-3 p-4">
			<span class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-marigold"><Sparkles size={19} /></span>
			<div>
				<p class="stat-value !text-2xl">{data.totalGenerated}</p>
				<p class="text-[0.7rem] font-semibold text-ink-soft">Generations saved</p>
			</div>
		</div>
		<div class="card flex items-center gap-3 p-4">
			<span class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-sky"><Target size={19} /></span>
			<div>
				<p class="stat-value !text-2xl">{data.totalAttempts}</p>
				<p class="text-[0.7rem] font-semibold text-ink-soft">Quiz attempts</p>
			</div>
		</div>
		<div class="card flex items-center gap-3 p-4">
			<span class="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink bg-leaf"><History size={19} /></span>
			<div>
				<p class="stat-value !text-2xl">{data.bestPercent}%</p>
				<p class="text-[0.7rem] font-semibold text-ink-soft">Best quiz score</p>
			</div>
		</div>
	</div>

	<div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
		<div class="flex flex-wrap gap-1.5">
			{#each kinds as kind (kind.value)}
				<a
					href="/study/history{kind.value ? `?kind=${kind.value}` : ''}{data.filters.q ? `${kind.value ? '&' : '?'}q=${encodeURIComponent(data.filters.q)}` : ''}"
					class="tab"
					class:is-active={activeKind === kind.value}
				>
					{kind.label}
					{#if kind.value}<span class="font-mono text-[0.6rem] opacity-70">{data.counts[kind.value] ?? 0}</span>{/if}
				</a>
			{/each}
		</div>

		<form method="GET" class="flex w-full gap-2 lg:max-w-sm">
			{#if activeKind}<input type="hidden" name="kind" value={activeKind} />{/if}
			<label class="relative flex-1">
				<span class="sr-only">Search generations</span>
				<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
				<input class="input !pl-9" type="search" name="q" value={data.filters.q} placeholder="Search titles…" />
			</label>
			<button type="submit" class="btn btn-secondary btn-sm">Search</button>
		</form>
	</div>

	{#if data.generations.length}
		<div class="grid gap-4 md:grid-cols-2">
			{#each data.generations as generation (generation.id)}
				{@const KindIcon = kindIcons[generation.kind]}
				{@const bestScore = best(generation.attempts)}
				<a
					href="/study/{generation.id}"
					class="card card-hover flex min-w-0 flex-col gap-3 p-4"
				>
					<div class="flex items-start gap-3">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#F4F0FF] text-violet">
							<KindIcon size={18} />
						</span>
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="badge badge-ai !px-1 !py-0 !text-[0.52rem]">✦ AI Generated</span>
								<span class="font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">{studyKindLabel(generation.kind)}</span>
							</div>
							<h2 class="mt-1 line-clamp-2 text-[0.92rem] font-bold leading-snug">{generation.title}</h2>
							<p class="mt-1 text-[0.68rem] text-ink-faint">
								{generation.subject?.code ?? 'General'} · {formatDate(generation.created_at)}
							</p>
						</div>
					</div>

					<div class="mt-auto flex flex-wrap items-center gap-2 border-t border-dashed border-ink/15 pt-2.5">
						{#if generation.topic}
							<span class="chip chip-soft !min-h-6 !text-[0.64rem]">{generation.topic.name}</span>
						{/if}
						<span class="chip chip-soft !min-h-6 !text-[0.64rem]">{generation.source_note_ids?.length ?? 0} sources</span>
						{#if generation.kind === 'quiz'}
							<span class="badge {bestScore === null ? 'badge-neutral' : bestScore >= 80 ? 'badge-verified' : 'badge-submitted'} !text-[0.55rem]">
								{bestScore === null ? 'Not attempted' : `Best ${bestScore}%`}
							</span>
						{/if}
						<span class="ml-auto font-mono text-[0.6rem] font-bold text-ink-soft">Open →</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<EmptyState
			title={data.filters.q || activeKind ? 'No material matches those filters' : 'No study material yet'}
			description={data.filters.q || activeKind
				? 'Try a different kind or clear the search to see everything you have generated.'
				: 'Pick a few community notes and the assistant will build a reviewer, summary, quiz or keyword list from them.'}
			icon={Sparkles}
		>
			{#if data.filters.q || activeKind}
				<a href="/study/history" class="btn btn-secondary btn-sm">Clear filters</a>
			{/if}
			<a href="/study" class="btn btn-primary btn-sm"><Wand2 size={15} /> Generate study material</a>
		</EmptyState>
	{/if}
</div>
