<script lang="ts">
	import type { PageData } from './$types';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Filter, PenLine, Search, SlidersHorizontal, StickyNote, X } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const savedSet = $derived(new Set(data.savedIds));
	const filteredSubjects = $derived(
		data.filters.department
			? data.taxonomy.subjects.filter((subject) => subject.department_id === data.filters.department)
			: data.taxonomy.subjects
	);
	const hasFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.department ||
				data.filters.subject ||
				data.filters.topic ||
				data.filters.status !== 'all' ||
				data.filters.mine
		)
	);

	function pageHref(target: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(target));
		return `?${params.toString()}`;
	}
</script>

<svelte:head><title>Community Notes · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Community library"
		title="Community notes"
		description="Notes, reviewers and lesson write-ups shared by students. Every item carries a label so you know how much trust to place in it."
	>
		<a href="/notes/new" class="btn btn-primary"><PenLine size={16} /> Write a note</a>
	</PageHeader>

	<div class="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-paper-card px-3 py-2.5">
		<span class="kicker !text-[0.6rem]">Labels</span>
		<Badge status="submitted" />
		<span class="text-[0.7rem] text-ink-soft">shared by a student, not yet reviewed</span>
		<Badge status="verified" />
		<span class="text-[0.7rem] text-ink-soft">checked by a student moderator</span>
		<Badge origin="ai" />
		<span class="text-[0.7rem] text-ink-soft">assembled from community notes</span>
	</div>

	<form method="GET" class="card p-3 sm:p-4" aria-label="Filter community notes">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-2 sm:flex-row">
				<label class="relative min-w-0 flex-1">
					<span class="sr-only">Search notes</span>
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input class="input !pl-9" type="search" name="q" value={data.filters.q} placeholder="Search titles, topics, keywords…" />
				</label>
				<label class="min-w-0 sm:w-44">
					<span class="sr-only">Department</span>
					<select class="select" name="department">
						<option value="">All departments</option>
						{#each data.taxonomy.departments as department (department.id)}
							<option value={department.id} selected={data.filters.department === department.id}>
								{department.short_name} · {department.name}
							</option>
						{/each}
					</select>
				</label>
				<label class="min-w-0 sm:w-52">
					<span class="sr-only">Subject</span>
					<select class="select" name="subject">
						<option value="">All subjects</option>
						{#each filteredSubjects as subject (subject.id)}
							<option value={subject.id} selected={data.filters.subject === subject.id}>
								{subject.code} · {subject.name}
							</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row sm:items-center">
				<label class="min-w-0 sm:w-48">
					<span class="sr-only">Topic</span>
					<select class="select" name="topic">
						<option value="">All topics</option>
						{#each data.taxonomy.topics as topic (topic.id)}
							<option value={topic.id} selected={data.filters.topic === topic.id}>{topic.name}</option>
						{/each}
					</select>
				</label>
				<label class="min-w-0 sm:w-40">
					<span class="sr-only">Status</span>
					<select class="select" name="status">
						<option value="all" selected={data.filters.status === 'all'}>Any status</option>
						<option value="verified" selected={data.filters.status === 'verified'}>Verified only</option>
						<option value="submitted" selected={data.filters.status === 'submitted'}>Submitted</option>
						{#if data.canModerate}
							<option value="rejected" selected={data.filters.status === 'rejected'}>Rejected</option>
						{/if}
					</select>
				</label>
				<label class="min-w-0 sm:w-40">
					<span class="sr-only">Sort</span>
					<select class="select" name="sort">
						<option value="newest" selected={data.filters.sort === 'newest'}>Newest first</option>
						<option value="oldest" selected={data.filters.sort === 'oldest'}>Oldest first</option>
						<option value="popular" selected={data.filters.sort === 'popular'}>Most downloaded</option>
					</select>
				</label>
				<label class="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 text-[0.75rem] font-bold">
					<input type="checkbox" name="mine" value="1" checked={data.filters.mine} class="h-4 w-4 accent-[#211D31]" />
					Only mine
				</label>
				<div class="ml-auto flex items-center gap-2">
					{#if hasFilters}
						<a href="/notes" class="btn btn-ghost btn-sm"><X size={14} /> Clear</a>
					{/if}
					<button type="submit" class="btn btn-ink btn-sm"><SlidersHorizontal size={14} /> Apply filters</button>
				</div>
			</div>
		</div>
	</form>

	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="kicker">{data.total} {data.total === 1 ? 'note' : 'notes'} found</p>
			{#if data.filters.q}
				<h2 class="mt-1 font-display text-xl font-extrabold">Results for “{data.filters.q}”</h2>
			{/if}
		</div>
		{#if data.filters.mine}<span class="chip chip-soft">Showing your contributions</span>{/if}
	</div>

	{#if data.error}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] p-3 text-sm text-[#8f1c12]">{data.error}</div>
	{/if}

	{#if data.notes.length}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each data.notes as note (note.id)}
				<NoteCard {note} saved={savedSet.has(note.id)} />
			{/each}
		</div>

		{#if data.pageCount > 1}
			<nav class="mt-2 flex flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/20 pt-4" aria-label="Pagination">
				<p class="text-[0.75rem] text-ink-soft">Page {data.page} of {data.pageCount}</p>
				<div class="flex items-center gap-2">
					{#if data.page > 1}
						<a href={pageHref(data.page - 1)} class="btn btn-secondary btn-sm"><ArrowLeft size={14} /> Previous</a>
					{/if}
					{#if data.page < data.pageCount}
						<a href={pageHref(data.page + 1)} class="btn btn-secondary btn-sm">Next <ArrowRight size={14} /></a>
					{/if}
				</div>
			</nav>
		{/if}
	{:else}
		<EmptyState
			title={hasFilters ? 'No notes match those filters' : 'The board is waiting for its first note'}
			description={hasFilters
				? 'Try a broader search, a different department, or clear the filters. Some notes may be visible only to their authors and moderators.'
				: 'Share a lesson summary, reviewer or formula sheet. A moderator will review it before it appears widely.'}
			icon={StickyNote}
		>
			{#if hasFilters}
				<a href="/notes" class="btn btn-secondary btn-sm"><Filter size={14} /> Clear filters</a>
			{/if}
			<a href="/notes/new" class="btn btn-primary btn-sm"><PenLine size={14} /> Write a note</a>
		</EmptyState>
	{/if}
</div>
