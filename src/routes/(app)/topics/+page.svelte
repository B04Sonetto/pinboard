<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import TopicBookmarkButton from '$lib/components/TopicBookmarkButton.svelte';
	import { ArrowUpRight, Bookmark, Compass, Search, StickyNote, X } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	type Topic = PageData['topics'][number];
	type Group = {
		id: string;
		name: string;
		color: string;
		short: string;
		sortOrder: number;
		topics: Topic[];
	};

	const bookmarked = $derived(new Set(data.bookmarked));

	const grouped = $derived.by(() => {
		const map = new Map<string, Group>();
		for (const topic of data.topics) {
			const department = topic.subject?.department;
			if (!department) continue;
			const entry = map.get(department.id) ?? {
				id: department.id,
				name: department.name,
				color: department.color,
				short: department.short_name,
				sortOrder: department.sort_order,
				topics: []
			};
			entry.topics.push(topic);
			map.set(department.id, entry);
		}
		return [...map.values()].sort(
			(a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
		);
	});

	const noteCount = (topic: Topic) => topic.notes?.[0]?.count ?? 0;
	const totalNotes = $derived(data.topics.reduce((sum, topic) => sum + noteCount(topic), 0));
	const hasFilters = $derived(Boolean(data.filters.q || data.filters.department || data.bookmarkedOnly));

	function departmentHref(id: string) {
		const params = new URLSearchParams();
		if (data.filters.q) params.set('q', data.filters.q);
		if (data.bookmarkedOnly) params.set('saved', '1');
		if (id) params.set('department', id);
		const query = params.toString();
		return `/topics${query ? `?${query}` : ''}`;
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

	<section class="rounded-xl border-[2.5px] border-ink bg-paper-card p-3 shadow-[4px_4px_0_var(--color-ink)] sm:p-4">
		<form method="GET" class="flex flex-col gap-2.5 lg:flex-row lg:items-center">
			<label class="relative min-w-0 flex-1">
				<span class="sr-only">Search topics</span>
				<Search size={17} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
				<input
					class="input !pl-10"
					type="search"
					name="q"
					value={data.filters.q}
					placeholder="Search topics by name, subject, or keyword…"
				/>
			</label>
			<label class="lg:w-64">
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
			<label
				class="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 text-[0.78rem] font-bold transition has-[:checked]:bg-marigold-soft"
			>
				<input
					type="checkbox"
					name="saved"
					value="1"
					checked={data.bookmarkedOnly}
					class="h-4 w-4 accent-[#211D31]"
				/>
				<Bookmark size={15} aria-hidden="true" /> Saved ({data.totalBookmarked})
			</label>
			<button type="submit" class="btn btn-ink btn-sm">Filter</button>
			{#if hasFilters}
				<a href="/topics" class="btn btn-ghost btn-sm"><X size={14} /> Clear</a>
			{/if}
		</form>

		<div class="mt-3 flex flex-wrap items-center gap-2 border-t-2 border-dashed border-ink/15 pt-3">
			<a
				href={departmentHref('')}
				class="chip !min-h-7 !text-[0.68rem] transition hover:bg-marigold"
				class:!bg-marigold={!data.filters.department}
			>
				All departments
			</a>
			{#each data.taxonomy.departments as department (department.id)}
				<a
					href={departmentHref(department.id)}
					class="chip chip-soft !min-h-7 !text-[0.68rem] transition hover:!bg-marigold-soft"
					style="border-left:5px solid {department.color || 'var(--color-marigold)'} "
					class:!bg-marigold-soft={data.filters.department === department.id}
					title={department.name}
				>
					{department.short_name}
					<span class="font-mono text-[0.6rem] text-ink-soft">
						{data.departmentCounts[department.id] ?? 0}
					</span>
				</a>
			{/each}
			<span class="ml-auto hidden font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-faint sm:inline">
				{#if hasFilters}
					{data.topics.length} of {data.matchedTopicCount} topics
				{:else}
					{data.topics.length} topics
				{/if}
				· {totalNotes} linked notes
			</span>
		</div>
	</section>

	{#if data.topics.length}
		<div class="flex flex-col gap-9">
			{#each grouped as group (group.id)}
				{@const groupNotes = group.topics.reduce((sum, topic) => sum + noteCount(topic), 0)}
				<section aria-labelledby={`dept-${group.id}`}>
					<div class="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 border-b-2 border-dashed border-ink/15 pb-2.5">
						<span
							class="h-4 w-4 shrink-0 -rotate-3 rounded-[4px] border-2 border-ink"
							style="background:{group.color || 'var(--color-marigold)'}"
							aria-hidden="true"
						></span>
						<h2 id={`dept-${group.id}`} class="font-display text-xl font-extrabold leading-tight">
							{group.name}
						</h2>
						<span class="chip chip-soft !min-h-6 !text-[0.6rem]">{group.short}</span>
						<span class="ml-auto font-mono text-[0.6rem] uppercase tracking-[0.06em] text-ink-faint">
							{group.topics.length} {group.topics.length === 1 ? 'topic' : 'topics'} · {groupNotes}
							{groupNotes === 1 ? 'note' : 'notes'}
						</span>
					</div>

					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each group.topics as topic (topic.id)}
							<article
								class="group relative flex flex-col gap-3 overflow-hidden rounded-xl border-[2.5px] border-ink bg-paper-card p-4 pt-5 shadow-[3px_3px_0_var(--color-ink)] transition duration-150 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--color-ink)]"
							>
								<span
									class="absolute inset-x-0 top-0 h-1.5 border-b-2 border-ink"
									style="background:{group.color || 'var(--color-marigold)'}"
									aria-hidden="true"
								></span>

								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="kicker !text-[0.58rem]">
											{topic.subject?.code ?? 'Topic'}{#if topic.subject?.name}
												· {topic.subject.name}
											{/if}
										</p>
										<h3 class="mt-1 font-display text-[1.05rem] font-extrabold leading-tight">
											<a href="/notes?topic={topic.id}" class="decoration-2 underline-offset-4 hover:underline">
												{topic.name}
											</a>
										</h3>
									</div>
									<TopicBookmarkButton topicId={topic.id} saved={bookmarked.has(topic.id)} />
								</div>

								{#if topic.description}
									<p class="line-clamp-2 text-[0.78rem] leading-relaxed text-ink-soft">{topic.description}</p>
								{:else}
									<p class="text-[0.78rem] italic leading-relaxed text-ink-faint">No description yet.</p>
								{/if}

								<div class="mt-auto flex items-center justify-between gap-2 border-t border-dashed border-ink/15 pt-3">
									<span class="inline-flex items-center gap-1.5 rounded-md border border-ink/20 bg-paper px-1.5 py-0.5 text-[0.68rem] font-bold text-ink-soft">
										<StickyNote size={12} aria-hidden="true" />
										{noteCount(topic)} {noteCount(topic) === 1 ? 'note' : 'notes'}
									</span>
									<a
										href="/notes?topic={topic.id}"
										class="inline-flex items-center gap-1 text-[0.7rem] font-bold text-violet hover:underline"
									>
										Browse <ArrowUpRight size={13} aria-hidden="true" />
									</a>
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
			{#if hasFilters}
				<a href="/topics" class="btn btn-secondary btn-sm">Show all topics</a>
			{/if}
			<a href="/suggestions" class="btn btn-primary btn-sm">Suggest a topic</a>
		</EmptyState>
	{/if}
</div>
