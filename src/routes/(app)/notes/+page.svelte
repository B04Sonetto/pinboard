<script lang="ts">
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowLeft, ArrowRight, Filter, GraduationCap, Lightbulb, Lock, PenLine, Plus, StickyNote, X } from '@lucide/svelte';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { dismissable } from '$lib/actions';
	import { DEFAULT_NOTE_COLOR } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	let filterForm = $state<HTMLFormElement>();
	let picker = $state<HTMLDetailsElement>();

	const savedSet = $derived(new Set(data.savedIds));
	const activeKey = $derived(data.currentDepartment?.id ?? 'community');

	const heading = $derived.by(() => {
		if (data.board === 'community') {
			return {
				title: 'Community Board',
				sub: 'Notes students chose to share with everyone, from every department.'
			};
		}
		if (data.board === 'own') {
			return {
				title: `${data.currentDepartment?.name} Board`,
				sub: `Everything from your department, including notes shared with ${data.currentDepartment?.short_name} only. This board is set from your enrollment.`
			};
		}
		return {
			title: `${data.currentDepartment?.name} Board`,
			sub: 'Only the notes this department shared with the whole community. Department-only notes stay private to its students.'
		};
	});

	const programs = $derived(
		data.currentDepartment
			? data.taxonomy.programs.filter((program) => program.department_id === data.currentDepartment!.id)
			: data.taxonomy.programs
	);
	const subjects = $derived(
		data.taxonomy.subjects.filter((subject) => {
			if (data.currentDepartment && subject.department_id !== data.currentDepartment.id) return false;
			if (data.filters.program && subject.program_id !== data.filters.program) return false;
			return true;
		})
	);
	const topics = $derived(
		data.filters.subject ? data.taxonomy.topics.filter((topic) => topic.subject_id === data.filters.subject) : []
	);

	const hasFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.program ||
				data.filters.subject ||
				data.filters.topic ||
				data.filters.year_level ||
				data.filters.semester ||
				data.filters.visibility !== 'all' ||
				data.filters.status !== 'all' ||
				data.filters.mine
		)
	);

	const boardHref = $derived(data.currentDepartment ? `/notes?department=${data.currentDepartment.id}` : '/notes');

	/** Values that mean "no filter" and so don't belong in the URL. */
	const DEFAULTS: Record<string, string> = { status: 'all', visibility: 'all', sort: 'newest' };

	function applyFilters() {
		if (!filterForm) return;
		const params = new URLSearchParams();
		for (const [key, raw] of new FormData(filterForm)) {
			const value = String(raw).trim();
			if (value && DEFAULTS[key] !== value) params.set(key, value);
		}
		const query = params.toString();
		goto(`${page.url.pathname}${query ? `?${query}` : ''}`, { keepFocus: true, noScroll: true });
	}

	function onFilterChange(event: Event) {
		const name = (event.target as HTMLSelectElement | HTMLInputElement).name;
		// Changing a parent filter invalidates the children below it.
		if (name === 'program') clearField('subject');
		if (name === 'program' || name === 'subject') clearField('topic');
		applyFilters();
	}

	function clearField(name: string) {
		const field = filterForm?.elements.namedItem(name);
		if (field instanceof HTMLSelectElement || field instanceof HTMLInputElement) field.value = '';
	}

	function pageHref(target: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(target));
		return `?${params.toString()}`;
	}
</script>

<svelte:head><title>{heading.title} · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-1.5">
		<p class="kicker">Community Notes · {data.total} {data.total === 1 ? 'note' : 'notes'}</p>
		<h1 class="display text-[2.25rem] sm:text-5xl">{heading.title}</h1>
		<p class="max-w-[680px] text-base leading-relaxed text-ink-mid">{heading.sub}</p>
	</header>

	<!-- Filters -->
	<form
		bind:this={filterForm}
		method="GET"
		aria-label="Filter notes"
		class="flex flex-wrap items-center gap-2"
		onchange={onFilterChange}
		onsubmit={(event) => {
			event.preventDefault();
			applyFilters();
		}}
	>
		{#if data.filters.q}<input type="hidden" name="q" value={data.filters.q} />{/if}
		{#if data.currentDepartment}<input type="hidden" name="department" value={data.currentDepartment.id} />{/if}

		<label>
			<span class="sr-only">Course</span>
			<select class="filter-pill" name="program" data-active={Boolean(data.filters.program)}>
				<option value="">Course</option>
				{#each programs as program (program.id)}
					<option value={program.id} selected={data.filters.program === program.id}>{program.code} · {program.name}</option>
				{/each}
			</select>
		</label>

		<label>
			<span class="sr-only">Year level</span>
			<select class="filter-pill" name="year_level" data-active={Boolean(data.filters.year_level)}>
				<option value="">Year level</option>
				{#each [1, 2, 3, 4, 5, 6] as year (year)}
					<option value={String(year)} selected={data.filters.year_level === String(year)}>Year {year}</option>
				{/each}
			</select>
		</label>

		<label>
			<span class="sr-only">Semester</span>
			<select class="filter-pill" name="semester" data-active={Boolean(data.filters.semester)}>
				<option value="">Semester</option>
				<option value="1" selected={data.filters.semester === '1'}>1st Semester</option>
				<option value="2" selected={data.filters.semester === '2'}>2nd Semester</option>
			</select>
		</label>

		<label>
			<span class="sr-only">Subject</span>
			<select class="filter-pill" name="subject" data-active={Boolean(data.filters.subject)}>
				<option value="">Subject</option>
				{#each subjects as subject (subject.id)}
					<option value={subject.id} selected={data.filters.subject === subject.id}>{subject.code} · {subject.name}</option>
				{/each}
			</select>
		</label>

		{#if topics.length}
			<label>
				<span class="sr-only">Topic</span>
				<select class="filter-pill" name="topic" data-active={Boolean(data.filters.topic)}>
					<option value="">Topic</option>
					{#each topics as topic (topic.id)}
						<option value={topic.id} selected={data.filters.topic === topic.id}>{topic.name}</option>
					{/each}
				</select>
			</label>
		{/if}

		<label>
			<span class="sr-only">Verification status</span>
			<select class="filter-pill" name="status" data-active={data.filters.status !== 'all'}>
				<option value="all">Any status</option>
				<option value="verified" selected={data.filters.status === 'verified'}>Verified only</option>
				<option value="submitted" selected={data.filters.status === 'submitted'}>Submitted</option>
				{#if data.canModerate}
					<option value="rejected" selected={data.filters.status === 'rejected'}>Rejected</option>
				{/if}
			</select>
		</label>

		{#if data.board === 'own'}
			<label>
				<span class="sr-only">Visibility</span>
				<select class="filter-pill" name="visibility" data-active={data.filters.visibility !== 'all'}>
					<option value="all">Any visibility</option>
					<option value="community" selected={data.filters.visibility === 'community'}>Community-wide</option>
					<option value="department" selected={data.filters.visibility === 'department'}>Department only</option>
				</select>
			</label>
		{/if}

		<label
			class="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 text-sm font-medium has-[:checked]:bg-marigold-soft has-[:checked]:font-bold"
		>
			<input type="checkbox" name="mine" value="1" checked={data.filters.mine} class="h-4 w-4 accent-ink" />
			Only mine
		</label>

		{#if hasFilters}
			<a href={boardHref} class="btn btn-ghost btn-sm"><X size={14} /> Clear</a>
		{/if}

		<span class="flex-1"></span>

		<label class="flex items-center gap-2 text-sm text-ink-soft">
			Sort:
			<select class="filter-pill !font-bold" name="sort">
				<option value="newest" selected={data.filters.sort === 'newest'}>Newest</option>
				<option value="oldest" selected={data.filters.sort === 'oldest'}>Oldest</option>
				<option value="popular" selected={data.filters.sort === 'popular'}>Most downloaded</option>
			</select>
		</label>

		<noscript><button type="submit" class="btn btn-ink btn-sm">Apply</button></noscript>
	</form>

	{#if data.filters.q}
		<p class="text-sm text-ink-mid">
			Showing results for <strong class="font-bold">“{data.filters.q}”</strong>
			{#if data.currentDepartment}in {data.currentDepartment.short_name}{/if}
		</p>
	{/if}

	{#if data.isFallback}
		<div class="flex items-center gap-2 rounded-lg border-2 border-violet bg-lilac/50 p-3 text-sm font-semibold text-violet">
			<Lightbulb size={16} /> No exact match for “{data.filters.q}”. Showing similar and partial matches.
		</div>
	{/if}

	{#if data.error}
		<div class="rounded-lg border-2 border-danger bg-[#fff1ef] p-3 text-sm text-danger" role="alert">{data.error}</div>
	{/if}

	<!-- Board: folder tabs + cork -->
	<div class="flex flex-col">
		<nav aria-label="Boards" class="relative z-[2] flex flex-wrap items-end gap-1.5 pl-3 sm:pl-5">
			{#each data.boards as tab (tab.key)}
				{@const active = tab.key === activeKey}
				{#if tab.kind === 'community' || tab.kind === 'own'}
					<a
						href={tab.href}
						class="folder-tab"
						data-active={active}
						aria-current={active ? 'page' : undefined}
						style="--tab-color:{tab.color}"
						title={tab.title}
					>
						{#if tab.kind === 'own'}<Lock size={14} strokeWidth={2.4} aria-hidden="true" />{/if}
						<span class="max-w-[12rem] truncate">{tab.label}</span>
						<span class="count">{tab.count}</span>
					</a>
				{:else}
					<div class="folder-tab !gap-0 !px-0" data-active={active} style="--tab-color:{tab.color}">
						<a
							href={tab.href}
							class="flex min-h-11 items-center gap-2.5 pl-4 pr-1.5"
							aria-current={active ? 'page' : undefined}
							title={tab.title}
						>
							<span class="max-w-[12rem] truncate">{tab.label}</span>
							<span class="count">{tab.count}</span>
						</a>
						<form method="POST" action={tab.kind === 'pinned' ? '?/unpin' : '?/pin'} use:enhance class="flex">
							<input type="hidden" name="department" value={tab.departmentId} />
							<button
								type="submit"
								class="flex min-h-11 w-9 items-center justify-center rounded-tr-lg hover:bg-black/10"
								aria-label={tab.kind === 'pinned' ? `Remove ${tab.title} board` : `Keep ${tab.title} board in my tabs`}
								title={tab.kind === 'pinned' ? 'Remove this board' : 'Keep this board in my tabs'}
							>
								{#if tab.kind === 'pinned'}
									<X size={14} strokeWidth={2.6} />
								{:else}
									<Plus size={14} strokeWidth={2.6} />
								{/if}
							</button>
						</form>
					</div>
				{/if}
			{/each}

			{#if !data.enrolledDepartment}
				<a href="/profile" class="folder-tab" title="Set your department in your profile">
					<GraduationCap size={15} aria-hidden="true" /> Set my department
				</a>
			{/if}

			<details class="relative -mb-[3px]" bind:this={picker} use:dismissable>
				<summary
					class="folder-tab folder-tab-add list-none [&::-webkit-details-marker]:hidden"
					aria-label="Add a department board"
					title="Add a department board"
				>
					<Plus size={18} strokeWidth={3} aria-hidden="true" />
				</summary>
				<div class="menu-panel absolute left-0 top-[calc(100%+12px)] z-30 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 p-4">
					<h2 class="font-display text-lg font-extrabold">Add a department board</h2>
					<p class="text-[0.8125rem] leading-relaxed text-ink-mid">
						You will see what that department shares with the community. Their department-only notes stay private.
					</p>
					{#each data.availableDepartments as department (department.id)}
						<form
							method="POST"
							action="?/pin"
							use:enhance={() => {
								return async ({ update }) => {
									if (picker) picker.open = false;
									await update();
								};
							}}
						>
							<input type="hidden" name="department" value={department.id} />
							<button
								type="submit"
								class="flex min-h-11 w-full items-center gap-2.5 rounded-lg border-2 border-ink bg-white px-3 text-left text-sm font-medium transition hover:bg-paper-card"
							>
								<span
									class="h-3.5 w-3.5 shrink-0 -rotate-6 border-2 border-ink"
									style="background:{department.color || DEFAULT_NOTE_COLOR}"
									aria-hidden="true"
								></span>
								<span class="flex-1 truncate" title={department.name}>{department.name}</span>
								<span class="font-bold">Add</span>
							</button>
						</form>
					{:else}
						<p class="text-sm">All departments are added.</p>
					{/each}
				</div>
			</details>
		</nav>

		<section
			aria-label="{heading.title} notes"
			class="cork relative z-[1] px-4 pb-12 pt-10 sm:px-8 sm:pb-[52px] sm:pt-12"
		>
			{#if data.notes.length}
				<ul class="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-x-[30px] gap-y-11">
					{#each data.notes as note (note.id)}
						<li>
							<NoteCard {note} saved={savedSet.has(note.id)} query={data.filters.q} flat={false} />
						</li>
					{/each}
				</ul>
			{:else}
				<div class="mx-auto max-w-xl rounded-2xl bg-paper-card">
					<EmptyState
						title={hasFilters ? 'No notes match those filters' : 'This board is waiting for its first note'}
						description={hasFilters
							? 'Try a broader search, a different board, or clear the filters.'
							: data.board === 'community'
								? 'Share a lesson summary, reviewer or formula sheet with every department.'
								: 'Share a lesson summary, reviewer or formula sheet for this department.'}
						icon={StickyNote}
					>
						{#if hasFilters}
							<a href={boardHref} class="btn btn-secondary btn-sm"><Filter size={14} /> Clear filters</a>
						{/if}
						{#if data.filters.q || data.filters.subject || data.filters.topic}
							<a href="/suggestions" class="btn btn-secondary btn-sm">
								<Lightbulb size={14} /> Suggest a missing subject or topic
							</a>
						{/if}
						<a href="/notes/new" class="btn btn-primary btn-sm"><PenLine size={14} /> Write a note</a>
					</EmptyState>
				</div>
			{/if}
		</section>
	</div>

	{#if data.pageCount > 1}
		<nav class="flex flex-wrap items-center justify-between gap-3" aria-label="Pagination">
			<p class="text-sm text-ink-soft">Page {data.page} of {data.pageCount}</p>
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

	<!-- Stamp legend -->
	<div class="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-mid">
		<span class="kicker">What the stamps mean</span>
		<span class="flex items-center gap-2"><span class="stamp stamp-submitted !text-[0.7rem]">Submitted</span> Awaiting review</span>
		<span class="flex items-center gap-2"><span class="stamp stamp-verified !text-[0.7rem]">Verified</span> Checked by moderators</span>
		<span class="flex items-center gap-2"><span class="stamp stamp-ai !text-[0.7rem]">AI Generated</span> Built from community notes</span>
	</div>
</div>
