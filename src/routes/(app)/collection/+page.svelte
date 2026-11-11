<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import TopicBookmarkButton from '$lib/components/TopicBookmarkButton.svelte';
	import {
		ArrowRight,
		BookMarked,
		Compass,
		FileQuestion,
		History,
		PenLine,
		StickyNote,
		Target,
		Trophy
	} from '@lucide/svelte';
	import { formatDate } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const tabs = $derived([
		{ value: 'notes' as const, label: 'Saved notes', href: '/collection', count: data.counts.notes, icon: StickyNote },
		{ value: 'topics' as const, label: 'Saved topics', href: '/collection?tab=topics', count: data.counts.topics, icon: Compass },
		{ value: 'quizzes' as const, label: 'Quiz history', href: '/collection?tab=quizzes', count: data.counts.attempts, icon: FileQuestion }
	]);

	function scorePercent(score: number, total: number) {
		return total ? Math.round((score / total) * 100) : 0;
	}
</script>

<svelte:head><title>My Collection · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Your library"
		title="My collection"
		description="Notes and topics you saved for later, plus every quiz attempt you have made. Your collection is private to your account."
	>
		<a href="/notes" class="btn btn-secondary"><StickyNote size={16} /> Browse notes</a>
		<a href="/study" class="btn btn-primary"><Target size={16} /> Study something</a>
	</PageHeader>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
		<div class="card p-3.5">
			<p class="kicker !text-[0.58rem]">Saved notes</p>
			<p class="stat-value mt-1 !text-2xl">{data.counts.notes}</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.58rem]">Saved topics</p>
			<p class="stat-value mt-1 !text-2xl">{data.counts.topics}</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.58rem]">Quiz attempts</p>
			<p class="stat-value mt-1 !text-2xl">{data.counts.attempts}</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.58rem]">Best score</p>
			<p class="stat-value mt-1 !text-2xl">{data.bestPercent}%</p>
		</div>
	</div>

	<div class="flex flex-wrap gap-1.5 border-b-2 border-dashed border-ink/20 pb-3">
		{#each tabs as tab (tab.value)}
			<a href={tab.href} class="tab" class:is-active={data.tab === tab.value}>
				<tab.icon size={15} />
				{tab.label}
				<span class="font-mono text-[0.6rem] opacity-70">{tab.count}</span>
			</a>
		{/each}
	</div>

	{#if data.tab === 'notes'}
		{#if data.savedNotes.length}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.savedNotes as note (note.id)}
					<NoteCard {note} saved />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No saved notes yet"
				description="Tap the bookmark on any community note and it will appear here for quick access before an exam."
				icon={BookMarked}
			>
				<a href="/notes" class="btn btn-primary btn-sm">Browse community notes</a>
			</EmptyState>
		{/if}
	{:else if data.tab === 'topics'}
		{#if data.savedTopics.length}
			<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.savedTopics as topic (topic.id)}
					<article class="card card-hover flex flex-col gap-2 p-4">
						<div class="flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="kicker !text-[0.58rem]">{topic.subject?.code ?? 'Topic'}</p>
								<h2 class="mt-1 font-display text-lg font-extrabold leading-tight">{topic.name}</h2>
								<p class="text-[0.68rem] text-ink-soft">{topic.subject?.name ?? 'Community topic'}</p>
							</div>
							<TopicBookmarkButton topicId={topic.id} saved />
						</div>
						{#if topic.description}
							<p class="line-clamp-2 text-[0.78rem] leading-relaxed text-ink-soft">{topic.description}</p>
						{/if}
						<a
							href="/courses/{topic.subject_id}{topic.subject ? `?topic=${topic.id}` : ''}"
							class="mt-auto flex items-center gap-1 text-[0.72rem] font-bold text-violet hover:underline"
						>
							Open subject notes <ArrowRight size={13} />
						</a>
					</article>
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No saved topics yet"
				description="Bookmark a topic from Explore Topics or a subject page to keep it close while you revise."
				icon={Compass}
			>
				<a href="/topics" class="btn btn-primary btn-sm">Explore topics</a>
			</EmptyState>
		{/if}
	{:else}
		{#if data.attempts.length}
			<div class="card overflow-hidden">
				<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
					<History size={17} />
					<h2 class="font-display text-lg font-extrabold">Quiz attempts</h2>
					<span class="ml-auto flex items-center gap-1 text-[0.68rem] font-bold text-ink-soft"><Trophy size={13} /> Best {data.bestPercent}%</span>
				</div>
				<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
					{#each data.attempts as attempt (attempt.id)}
						{@const generation = attempt.generation}
						{@const percent = scorePercent(attempt.score, attempt.total)}
						{#if generation}
							<li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
								<div class="min-w-0">
									<p class="line-clamp-1 text-[0.85rem] font-bold">{generation.title}</p>
									<p class="mt-0.5 text-[0.68rem] text-ink-soft">
										{generation.subject?.code ?? 'General'}
										{#if generation.topic}· {generation.topic.name}{/if}
										· {formatDate(attempt.created_at)}
									</p>
								</div>
								<div class="flex shrink-0 items-center gap-2">
									<span class="font-mono text-[0.64rem] text-ink-faint">{attempt.score}/{attempt.total}</span>
									<span class="badge {percent >= 80 ? 'badge-verified' : percent >= 50 ? 'badge-submitted' : 'badge-rejected'} !text-[0.6rem]">
										{percent}%
									</span>
									<a href="/study/{generation.id}/quiz" class="btn btn-secondary btn-sm">Retake</a>
									<a href="/study/{generation.id}" class="btn btn-ghost btn-sm">Review</a>
								</div>
							</li>
						{/if}
					{/each}
				</ul>
			</div>
		{:else}
			<EmptyState
				title="No quiz attempts yet"
				description="Generate a practice quiz from notes you trust, then your attempts and scores will be recorded here."
				icon={FileQuestion}
			>
				<a href="/study" class="btn btn-primary btn-sm">Build a practice quiz</a>
			</EmptyState>
		{/if}
	{/if}

	{#if data.contributions.length && data.tab === 'notes'}
		<section class="mt-2">
			<div class="mb-3 flex items-end justify-between">
				<div>
					<p class="kicker">Your notes</p>
					<h2 class="mt-1 font-display text-xl font-extrabold">Recent contributions</h2>
				</div>
				<a href="/profile" class="link text-[0.78rem]">View all on profile</a>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each data.contributions as note (note.id)}
					<a href="/notes/{note.id}" class="card flex items-center gap-3 p-3 hover:bg-paper-deep/60">
						<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-marigold-soft"><PenLine size={15} /></span>
						<span class="min-w-0 flex-1">
							<span class="line-clamp-1 text-[0.82rem] font-bold">{note.title}</span>
							<span class="text-[0.66rem] text-ink-soft">{note.subject?.code ?? 'Subject'} · {formatDate(note.created_at)}</span>
						</span>
						<span class="badge {note.status === 'verified' ? 'badge-verified' : note.status === 'rejected' ? 'badge-rejected' : 'badge-submitted'} !text-[0.52rem]">
							{note.status}
						</span>
					</a>
				{/each}
			</div>
		</section>
	{/if}
</div>
