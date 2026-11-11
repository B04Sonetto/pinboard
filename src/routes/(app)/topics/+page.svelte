<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TopicBookmarkButton from '$lib/components/TopicBookmarkButton.svelte';
	import { Bookmark, Compass, Search, StickyNote, X } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const bookmarked = $derived(new Set(data.bookmarked));
	const grouped = $derived.by(() => {
		const map = new Map<string, { name: string; color: string; short: string; topics: typeof data.topics }>();
		for (const topic of data.topics) {
			const department = topic.subject?.department;
			if (!department) continue;
			const entry = map.get(department.id) ?? {
				name: department.name,
				color: department.color,
				short: department.short_name,
				topics: []
			};
			entry.topics.push(topic);
			map.set(department.id, entry);
		}
		return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
	});

	function noteCount(topic: (typeof data.topics)[number]) {
		return topic.notes?.[0]?.count ?? 0;
	}
</script>

<svelte:head><title>Explore Topics · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Find your next study session"
		title="Explore topics"
		description="Browse the concepts students are writing about. Bookmark a topic to keep it close and jump straight to its notes."
	>
		<a href="/courses" class="btn btn-secondary">Browse courses</a>
		<a href="/notes/new" class="btn btn-primary">Contribute a note</a>
	</PageHeader>

	<form method="GET" class="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:p-4">
		<label class="relative min-w-0 flex-1">
			<span class="sr-only">Search topics</span>
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
			<input class="input !pl-9" type="search" name="q" value={data.filters.q} placeholder="Search topics by name…" />
		</label>
		<label class="sm:w-56">
			<span class="sr-only">Department</span>
			<select class="select" name="department">
				<option value="">All departments</option>
				{#each data.taxonomy.departments as department (department.id)}
					<option value={department.id} selected={data.filters.department === department.id}>{department.short_name} · {department.name}</option>
				{/each}
			</select>
		</label>
		<label class="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink px-3 py-2 text-[0.75rem] font-bold">
			<input type="checkbox" name="saved" value="1" checked={data.bookmarkedOnly} class="h-4 w-4 accent-[#211D31]" />
			<Bookmark size={14} /> Bookmarked ({data.totalBookmarked})
		</label>
		<button type="submit" class="btn btn-ink btn-sm">Filter</button>
		{#if data.filters.q || data.filters.department || data.bookmarkedOnly}
			<a href="/topics" class="btn btn-ghost btn-sm"><X size={14} /> Clear</a>
		{/if}
	</form>

	{#if data.topics.length}
		<div class="flex flex-col gap-8">
			{#each grouped as group (group.name)}
				<section>
					<div class="mb-3 flex items-center gap-2">
						<span class="h-4 w-4 rounded border-2 border-ink" style="background:{group.color}"></span>
						<h2 class="font-display text-xl font-extrabold">{group.name}</h2>
						<span class="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-faint">{group.short} · {group.topics.length} topics</span>
					</div>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each group.topics as topic (topic.id)}
							<article class="card card-hover flex flex-col gap-2 p-4">
								<div class="flex items-start justify-between gap-2">
									<a href="/notes?topic={topic.id}" class="min-w-0">
										<p class="kicker !text-[0.58rem]">{topic.subject?.code ?? 'Topic'} · {topic.subject?.name ?? ''}</p>
										<h3 class="mt-1 font-display text-[1.05rem] font-extrabold leading-tight hover:underline">{topic.name}</h3>
									</a>
									<TopicBookmarkButton topicId={topic.id} saved={bookmarked.has(topic.id)} />
								</div>
								{#if topic.description}<p class="line-clamp-2 text-[0.76rem] leading-relaxed text-ink-soft">{topic.description}</p>{/if}
								<div class="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-ink/15 pt-2.5">
									<span class="flex items-center gap-1 text-[0.68rem] font-bold text-ink-soft"><StickyNote size={12} /> {noteCount(topic)} notes</span>
									<a href="/notes?topic={topic.id}" class="text-[0.7rem] font-bold text-violet hover:underline">Browse →</a>
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{:else}
		<EmptyState
			title={data.bookmarkedOnly ? 'No bookmarked topics yet' : 'No topics match your search'}
			description="Try a different department or search term. Topics are added as students contribute notes and suggestions."
			icon={Compass}
		>
			{#if data.bookmarkedOnly || data.filters.q || data.filters.department}
				<a href="/topics" class="btn btn-secondary btn-sm">Show all topics</a>
			{/if}
			<a href="/suggestions" class="btn btn-primary btn-sm">Suggest a topic</a>
		</EmptyState>
	{/if}
</div>
