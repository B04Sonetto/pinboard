<script lang="ts">
	import type { PageData } from './$types';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TopicBookmarkButton from '$lib/components/TopicBookmarkButton.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import {
		ArrowLeft,
		BookOpen,
		GraduationCap,
		Layers3,
		PenLine,
		Sparkles,
		StickyNote,
		X
	} from '@lucide/svelte';
	import { semesterLabel, yearLabel } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const saved = $derived(new Set(data.savedIds));
	const topicSaved = $derived(new Set(data.topicIds));
	const noteTotal = $derived(data.notes.length);
</script>

<svelte:head>
	<title>{data.subject.code} · {data.subject.name} · Pinboard</title>
</svelte:head>

<div class="flex flex-col gap-6">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft" aria-label="Breadcrumb">
		<a href="/courses" class="hover:text-ink hover:underline">Courses</a>
		<span class="text-ink-faint">/</span>
		<a href="/courses?department={data.subject.department_id}" class="hover:text-ink hover:underline">{data.subject.department?.short_name ?? 'Department'}</a>
		<span class="text-ink-faint">/</span>
		<span class="text-ink">{data.subject.code}</span>
	</nav>

	<header class="card relative overflow-hidden p-5 sm:p-7" style="border-left-width:10px;border-left-color:{data.subject.department?.color ?? '#FFD34D'}">
		<span class="absolute right-6 top-0 h-3 w-20 -translate-y-1/2 rotate-[-3deg] bg-[#FFF1B5]/90" aria-hidden="true"></span>
		<div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
			<div class="min-w-0 max-w-3xl">
				<div class="flex flex-wrap items-center gap-2">
					<span class="badge" style="background:{data.subject.department?.color ?? '#FFD34D'}">{data.subject.code}</span>
					<span class="badge badge-neutral">{data.subject.department?.short_name ?? 'Community'}</span>
					{#if data.subject.program}<span class="badge badge-neutral">{data.subject.program.code}</span>{/if}
					<span class="badge badge-submitted">Community Submitted</span>
				</div>
				<h1 class="display mt-3 text-[2rem] leading-[1.05] sm:text-[2.5rem]">{data.subject.name}</h1>
				{#if data.subject.description}
					<p class="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">{data.subject.description}</p>
				{/if}
				<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[0.72rem] text-ink-soft">
					<span class="flex items-center gap-1"><GraduationCap size={13} /> {yearLabel(data.subject.year_level)}</span>
					<span>{semesterLabel(data.subject.semester)}</span>
					{#if data.subject.program}<span>{data.subject.program.name}</span>{/if}
				</div>
			</div>
			<div class="flex flex-wrap gap-2 lg:flex-col">
				<a href="/notes/new?subject={data.subject.id}" class="btn btn-primary"><PenLine size={16} /> Add a note</a>
				<a href="/study?subject={data.subject.id}" class="btn btn-secondary"><Sparkles size={16} /> Study this subject</a>
			</div>
		</div>

		<div class="mt-5 grid grid-cols-3 gap-2 border-t-2 border-dashed border-ink/20 pt-4">
			<div><div class="stat-value !text-lg">{noteTotal}</div><div class="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-soft">Visible notes</div></div>
			<div><div class="stat-value !text-lg">{data.verifiedCount}</div><div class="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-soft">Verified</div></div>
			<div><div class="stat-value !text-lg">{data.topics.length}</div><div class="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-ink-soft">Topics</div></div>
		</div>
	</header>

	<div class="rounded-xl border-2 border-ink bg-[#F3EDDD] px-4 py-3">
		<p class="flex items-start gap-2 text-[0.76rem] leading-relaxed text-ink-soft">
			<BookOpen size={15} class="mt-0.5 shrink-0" />
			<strong class="text-ink">This course page is community-maintained.</strong> The subject code, description and topics may not match the official prospectus. Confirm requirements with your department.
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
		<section class="min-w-0">
			<div class="mb-3 flex flex-wrap items-end justify-between gap-2">
				<div>
					<p class="kicker">Course notes</p>
					<h2 class="mt-1 font-display text-xl font-extrabold">
						{data.filters.topic ? data.topics.find((topic) => topic.id === data.filters.topic)?.name ?? 'Filtered notes' : 'All notes in this subject'}
					</h2>
				</div>
				<form method="GET" class="flex items-center gap-1.5">
					{#if data.filters.topic}<input type="hidden" name="topic" value={data.filters.topic} />{/if}
					<label>
						<span class="sr-only">Sort notes</span>
						<select class="select !min-h-9 !py-1 !text-[0.75rem]" name="sort">
							<option value="newest" selected={data.filters.sort === 'newest'}>Newest</option>
							<option value="popular" selected={data.filters.sort === 'popular'}>Most downloaded</option>
						</select>
					</label>
					<button type="submit" class="btn btn-secondary btn-sm">Sort</button>
					{#if data.filters.topic}<a href="/courses/{data.subject.id}" class="btn btn-ghost btn-sm"><X size={13} /></a>{/if}
				</form>
			</div>

			{#if data.notes.length}
				<div class="grid gap-4 sm:grid-cols-2">
					{#each data.notes as note (note.id)}
						<NoteCard {note} saved={saved.has(note.id)} />
					{/each}
				</div>
			{:else}
				<EmptyState
					title={data.filters.topic ? 'No notes under this topic yet' : 'No notes for this subject yet'}
					description="Be the first to share a reviewer, formula sheet or lesson summary. Notes are reviewed before they are verified."
					icon={StickyNote}
				>
					<a href="/notes/new?subject={data.subject.id}" class="btn btn-primary btn-sm">Write the first note</a>
				</EmptyState>
			{/if}
		</section>

		<aside class="flex flex-col gap-4">
			<section class="card overflow-hidden">
				<div class="flex items-center gap-2 border-b-2 border-ink bg-paper-deep px-4 py-2.5">
					<Layers3 size={16} />
					<h2 class="font-display text-base font-extrabold">Topics</h2>
					<span class="ml-auto font-mono text-[0.6rem] text-ink-soft">{data.topics.length}</span>
				</div>
				{#if data.topics.length}
					<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
						{#each data.topics as topic (topic.id)}
							<li class="flex items-start gap-2 px-3 py-2.5">
								<a href="/courses/{data.subject.id}?topic={topic.id}" class="min-w-0 flex-1 group">
									<span class="block text-[0.78rem] font-bold leading-snug group-hover:underline" class:underline={data.filters.topic === topic.id}>{topic.name}</span>
									<span class="block text-[0.64rem] text-ink-soft">{topic.notes?.[0]?.count ?? 0} notes</span>
								</a>
								<TopicBookmarkButton topicId={topic.id} saved={topicSaved.has(topic.id)} />
							</li>
						{/each}
					</ul>
				{:else}
					<p class="p-4 text-sm text-ink-soft">No topics listed for this subject yet.</p>
				{/if}
			</section>

			{#if data.siblings.length}
				<section class="card p-4">
					<p class="kicker !text-[0.6rem]">In the same department</p>
					<ul class="mt-2 flex flex-col gap-1.5">
						{#each data.siblings as sibling (sibling.id)}
							<li>
								<a href="/courses/{sibling.id}" class="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-[0.75rem] hover:bg-paper-deep">
									<span class="min-w-0"><span class="font-mono text-[0.62rem] text-ink-faint">{sibling.code}</span><span class="block truncate font-semibold">{sibling.name}</span></span>
									<span class="text-ink-faint">→</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<a href="/courses" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> All courses</a>
		</aside>
	</div>
</div>
