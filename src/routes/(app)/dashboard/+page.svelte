<script lang="ts">
	import type { PageData } from './$types';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import {
		ArrowRight,
		BookMarked,
		CalendarDays,
		CheckCircle2,
		Download,
		Flame,
		Lightbulb,
		PenLine,
		Sparkles,
		StickyNote,
		TrendingUp
	} from '@lucide/svelte';
	import { formatDate, firstName, greeting, relativeTime, studyKindLabel } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
	const savedSet = $derived(new Set(data.savedIds));

	function activityText(kind: string) {
		switch (kind) {
			case 'note_verified':
				return 'verified a community note';
			case 'note_rejected':
				return 'returned a note for revision';
			default:
				return 'shared a new note';
		}
	}
</script>

<svelte:head><title>Dashboard · Pinboard</title></svelte:head>

<div class="flex flex-col gap-7">
	{#if data.notice === 'password-updated'}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]">
			<CheckCircle2 size={17} /> Password updated. Your account is secure.
		</div>
	{/if}

	<header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="kicker">{today}</p>
			<h1 class="display mt-1.5 text-[2rem] leading-tight sm:text-[2.7rem]">
				{greeting()}, {firstName(data.profile.full_name)}.
			</h1>
			<p class="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
				Your board is ready. Pick up a saved note, browse what the community verified this week, or turn your
				notes into a reviewer.
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<a href="/notes/new" class="btn btn-primary"><PenLine size={16} /> Write a note</a>
			<a href="/study" class="btn btn-secondary"><Sparkles size={16} /> Study assistant</a>
		</div>
	</header>

	<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
		<StatCard label="Saved notes" value={data.counts.saved} icon={BookMarked} tint="#FFF0B5" hint="In My Collection" />
		<StatCard label="Contributions" value={data.counts.contributions} icon={StickyNote} tint="#BFE0FF" hint="Notes you shared" />
		<StatCard label="Quiz attempts" value={data.counts.attempts} icon={CheckCircle2} tint="#BDEBCB" hint="Practice makes recall" />
		<StatCard label="Verified notes" value={data.available} icon={CheckCircle2} tint="#DCD0FF" hint="Available to study" />
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
		<div class="flex min-w-0 flex-col gap-6">
			{#if data.savedNotes.length}
				<section>
					<div class="mb-3 flex items-end justify-between gap-3">
						<div>
							<p class="kicker">Continue studying</p>
							<h2 class="mt-1 font-display text-xl font-extrabold">Your recent saves</h2>
						</div>
						<a href="/collection" class="link text-[0.78rem]">View collection</a>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each data.savedNotes.slice(0, 2) as note (note.id)}
							<NoteCard {note} saved={savedSet.has(note.id)} />
						{/each}
					</div>
				</section>
			{/if}

			<section>
				<div class="mb-3 flex items-end justify-between gap-3">
					<div>
						<p class="kicker">Community board</p>
						<h2 class="mt-1 font-display text-xl font-extrabold">Fresh from your community</h2>
					</div>
					<a href="/notes" class="link text-[0.78rem]">Browse all notes</a>
				</div>
				{#if data.freshNotes.length}
					<div class="grid gap-4 sm:grid-cols-2">
						{#each data.freshNotes.slice(0, 4) as note (note.id)}
							<NoteCard {note} saved={savedSet.has(note.id)} />
						{/each}
					</div>
				{:else}
					<EmptyState
						title="No notes yet"
						description="New notes appear here as soon as students publish them. You can be the first to contribute."
						icon={StickyNote}
					>
						<a href="/notes/new" class="btn btn-primary btn-sm">Write the first note</a>
					</EmptyState>
				{/if}
			</section>
		</div>

		<aside class="flex flex-col gap-5">
			<section class="card p-4">
				<div class="flex items-center justify-between gap-2">
					<h2 class="font-display text-lg font-extrabold">Recent activity</h2>
					<CalendarDays size={16} class="text-ink-soft" />
				</div>
				{#if data.recentActivity.length}
					<ul class="mt-3 flex flex-col divide-y divide-dashed divide-ink/15">
						{#each data.recentActivity.slice(0, 5) as item (item.id)}
							<li class="flex gap-2.5 py-2.5 first:pt-0 last:pb-0">
								<Avatar name={item.actor?.full_name} color={item.actor?.avatar_color} size={28} />
								<div class="min-w-0">
									<p class="text-[0.76rem] font-semibold leading-snug">
										{item.actor?.full_name?.split(' ')[0] ?? 'A student'} {activityText(item.kind)}
									</p>
									{#if item.note}
										<a href="/notes/{item.note.id}" class="mt-0.5 block truncate text-[0.72rem] text-violet hover:underline">
											{item.note.title}
										</a>
									{/if}
									<p class="text-[0.62rem] text-ink-faint">{relativeTime(item.created_at)}</p>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-sm text-ink-soft">No activity yet. Be the first to share a note.</p>
				{/if}
			</section>

			<section class="card overflow-hidden">
				<div class="flex items-center gap-2 border-b-2 border-ink bg-marigold-soft px-4 py-2.5">
					<Lightbulb size={17} />
					<h2 class="font-display text-base font-extrabold">Topics to explore</h2>
				</div>
				<div class="flex flex-col divide-y divide-dashed divide-ink/15">
					{#each data.suggestedTopics as topic (topic.id)}
						<a href="/topics?focus={topic.id}" class="group flex items-start gap-2 px-4 py-2.5 hover:bg-paper-deep/60">
							<span class="mt-1 h-2 w-2 shrink-0 rounded-full border border-ink" style="background:{topic.subject?.department?.color ?? '#FFD34D'}"></span>
							<span class="min-w-0">
								<span class="block text-[0.78rem] font-bold leading-snug group-hover:underline">{topic.name}</span>
								<span class="block truncate text-[0.68rem] text-ink-soft">{topic.subject?.code ?? ''} {topic.subject?.name ?? ''}</span>
							</span>
						</a>
					{/each}
				</div>
				<a href="/topics" class="flex items-center justify-between border-t-2 border-ink px-4 py-2.5 text-[0.75rem] font-bold hover:bg-paper-deep">
					Explore all topics <ArrowRight size={14} />
				</a>
			</section>

			<section class="card p-4">
				<div class="flex items-center gap-2">
					<Flame size={17} class="text-[#c2410c]" />
					<h2 class="font-display text-lg font-extrabold">Most downloaded</h2>
				</div>
				<ol class="mt-3 flex flex-col gap-2.5">
					{#each data.trending as note, index (note.id)}
						<li>
							<a href="/notes/{note.id}" class="group flex gap-2.5">
								<span class="font-mono text-[0.7rem] font-bold text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
								<span class="min-w-0">
									<span class="block text-[0.78rem] font-bold leading-snug group-hover:underline">{note.title}</span>
									<span class="flex items-center gap-1 text-[0.65rem] text-ink-soft">
										<Download size={10} /> {note.downloads} downloads · {note.subject?.code}
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ol>
			</section>

			{#if data.attempts.length}
				<section class="card p-4">
					<div class="flex items-center justify-between">
						<h2 class="font-display text-lg font-extrabold">Quiz history</h2>
						<TrendingUp size={16} class="text-ink-soft" />
					</div>
					<ul class="mt-3 flex flex-col gap-2">
						{#each data.attempts as attempt (attempt.id)}
							<li class="flex items-center justify-between gap-2 text-[0.75rem]">
								<span class="min-w-0">
									<a href="/study/{attempt.generation?.id}" class="block truncate font-semibold hover:underline">
										{attempt.generation?.title ?? 'Practice quiz'}
									</a>
									<span class="text-[0.64rem] text-ink-faint">
										{attempt.generation?.kind === 'exam' ? 'Practice Exam' : studyKindLabel('quiz')} · {formatDate(attempt.created_at)}
									</span>
								</span>
								<span class="shrink-0 rounded border-[1.5px] border-ink px-1.5 py-0.5 font-mono text-[0.65rem] font-bold"
									style="background:{attempt.score / Math.max(1, attempt.total) >= 0.7 ? '#BDEBCB' : '#FFF0B5'}">
									{attempt.score}/{attempt.total}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</aside>
	</div>
</div>
