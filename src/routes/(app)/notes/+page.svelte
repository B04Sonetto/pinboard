<script lang="ts">
	import type { PageData } from './$types';
	import { untrack } from 'svelte';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { page } from '$app/state';
	import {
		ArrowLeft,
		ArrowRight,
		Building2,
		ChevronDown,
		Filter,
		Globe,
		GraduationCap,
		Lightbulb,
		PenLine,
		Plus,
		Search,
		SlidersHorizontal,
		StickyNote,
		X
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let showOtherDeptMenu = $state(false);
	let recentSearches = $state<string[]>([]);

	$effect(() => {
		try {
			const stored = localStorage.getItem('pinboard_recent_note_searches');
			if (stored) {
				const parsed: unknown = JSON.parse(stored);
				if (Array.isArray(parsed)) recentSearches = parsed.filter((item): item is string => typeof item === 'string').slice(0, 5);
			}
		} catch {
			// Ignore unavailable or malformed browser storage.
		}
	});
	let showAdvancedFilters = $state(
		untrack(() =>
			Boolean(
				data.filters.program ||
					data.filters.year_level ||
					data.filters.semester ||
					data.filters.topic ||
					data.filters.visibility !== 'all'
			)
		)
	);

	const savedSet = $derived(new Set(data.savedIds));
	const isEnrolledView = $derived(
		Boolean(
			data.filters.department &&
				data.enrolledDepartment &&
				data.filters.department === data.enrolledDepartment.id
		)
	);
	const isOtherDeptView = $derived(
		Boolean(
			data.filters.department &&
				(!data.enrolledDepartment || data.filters.department !== data.enrolledDepartment.id)
		)
	);
	const isAllCommunityView = $derived(!data.filters.department);

	const filteredPrograms = $derived(
		data.filters.department
			? data.taxonomy.programs.filter((p) => p.department_id === data.filters.department)
			: data.taxonomy.programs
	);

	const filteredSubjects = $derived(
		data.taxonomy.subjects.filter((subject) => {
			if (data.filters.department && subject.department_id !== data.filters.department) return false;
			if (data.filters.program && subject.program_id !== data.filters.program) return false;
			return true;
		})
	);

	const filteredTopics = $derived(
		data.taxonomy.topics.filter((topic) =>
			data.filters.subject
				? topic.subject_id === data.filters.subject
				: filteredSubjects.some((subject) => subject.id === topic.subject_id)
		)
	);

	const hasFilters = $derived(
		Boolean(
			data.filters.q ||
				data.filters.department ||
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

	function rememberSearch(event: SubmitEvent) {
		const form = event.currentTarget as HTMLFormElement;
		const query = String(new FormData(form).get('q') ?? '').trim();
		if (!query) return;
		recentSearches = [query, ...recentSearches.filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 5);
		try {
			localStorage.setItem('pinboard_recent_note_searches', JSON.stringify(recentSearches));
		} catch {
			// Search still proceeds when browser storage is unavailable.
		}
	}

	function pageHref(target: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(target));
		return `?${params.toString()}`;
	}
</script>

<svelte:head><title>Community Notes · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Academic Repository"
		title="Community Notes"
		description="Notes, reviewers, and lesson materials shared by LSPU students across departments. Check the author and verification label before you rely on a note."
	>
		<a href="/notes/new" class="btn btn-primary"><PenLine size={16} /> Write a note</a>
	</PageHeader>

	<!-- Department Navigation Tabs (Enrollment fixed + Community + Other departments with + button) -->
	<div class="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink pb-4">
		<div class="flex flex-wrap items-center gap-2">
			<!-- All Community Notes Tab -->
			<a
				href="/notes"
				class="btn btn-sm transition {isAllCommunityView ? 'btn-primary' : 'btn-secondary'}"
			>
				<Globe size={15} />
				<span>Community (All Departments)</span>
			</a>

			<!-- Enrolled Department Tab -->
			{#if data.enrolledDepartment}
				<a
					href="/notes?department={data.enrolledDepartment.id}"
					class="btn btn-sm transition {isEnrolledView ? 'btn-primary' : 'btn-secondary'}"
				>
					<span
						class="h-2.5 w-2.5 rounded-full border border-ink"
						style="background: {data.enrolledDepartment.color || '#FFD34D'}"
					></span>
					<span>My Department ({data.enrolledDepartment.short_name})</span>
					<span class="chip chip-soft !min-h-4 !px-1 !text-[0.55rem] font-bold">Enrolled</span>
				</a>
			{:else}
				<a
					href="/profile"
					class="btn btn-secondary btn-sm"
					title="Set your enrolled department in your profile"
				>
					<GraduationCap size={15} />
					<span>Set My Department</span>
				</a>
			{/if}

			<!-- + View Other Departments Button & Menu (User Optional) -->
			<div class="relative">
				<button
					type="button"
					class="btn btn-secondary btn-sm"
					aria-expanded={showOtherDeptMenu}
					onclick={() => (showOtherDeptMenu = !showOtherDeptMenu)}
				>
					<Plus size={15} strokeWidth={2.6} />
					<span>Other Departments</span>
					<ChevronDown size={14} class="opacity-70" />
				</button>

				{#if showOtherDeptMenu}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="fixed inset-0 z-40"
						tabindex="-1"
						role="button"
						aria-label="Close other departments menu"
						onclick={() => (showOtherDeptMenu = false)}
					></div>
					<div class="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border-2 border-ink bg-paper-card p-2 shadow-xl">
						<div class="px-2 py-1 border-b border-ink/20 pb-1.5 mb-1 flex items-center justify-between">
							<p class="font-mono text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">
								Choose Department
							</p>
							<span class="text-[0.62rem] text-ink-faint">User optional</span>
						</div>
						<div class="scroll-thin max-h-60 overflow-y-auto flex flex-col gap-1">
							{#each data.taxonomy.departments as dept (dept.id)}
								<a
									href="/notes?department={dept.id}"
									class="flex items-center gap-2 rounded-lg p-2 text-xs font-bold transition hover:bg-paper-deep {data.filters.department === dept.id ? 'bg-marigold-soft' : ''}"
									onclick={() => (showOtherDeptMenu = false)}
								>
									<span class="h-2.5 w-2.5 rounded-full border border-ink" style="background: {dept.color || '#FFD34D'}"></span>
									<span class="flex-1 truncate">{dept.short_name} · {dept.name}</span>
									{#if dept.id === data.enrolledDepartment?.id}
										<span class="chip chip-soft !min-h-4 !px-1 !text-[0.52rem]">Enrolled</span>
									{/if}
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Current scope indicator pill -->
		{#if isOtherDeptView && data.currentDepartment}
			<div class="flex items-center gap-2 rounded-lg border-2 border-ink bg-paper-deep px-3 py-1 text-xs">
				<span class="font-bold">Viewing: {data.currentDepartment.short_name} · {data.currentDepartment.name}</span>
				<a href="/notes" class="text-ink-soft hover:text-ink font-mono text-[0.7rem]" title="Clear department filter">×</a>
			</div>
		{/if}
	</div>

	<!-- Department scope context banner -->
	{#if isEnrolledView && data.enrolledDepartment}
		<div
			class="flex items-center justify-between rounded-xl border-2 border-ink p-3.5"
			style="background-color: var(--color-paper-card); border-left-width: 6px; border-left-color: {data.enrolledDepartment.color || '#FFD34D'}"
		>
			<div class="flex items-center gap-3">
				<Building2 size={20} class="text-ink shrink-0" />
				<div>
					<p class="font-display text-sm font-extrabold leading-tight">
						{data.enrolledDepartment.name} ({data.enrolledDepartment.short_name}) Notes
					</p>
					<p class="text-[0.72rem] text-ink-soft">
						Showing all materials shared for your enrolled college (including department-only and community-wide notes).
					</p>
				</div>
			</div>
			<a href="/notes" class="btn btn-ghost btn-sm !text-xs shrink-0">Switch to Community →</a>
		</div>
	{:else if isOtherDeptView && data.currentDepartment}
		<div
			class="flex items-center justify-between rounded-xl border-2 border-ink p-3.5"
			style="background-color: var(--color-paper-card); border-left-width: 6px; border-left-color: {data.currentDepartment.color || '#FFD34D'}"
		>
			<div class="flex items-center gap-3">
				<Building2 size={20} class="text-ink shrink-0" />
				<div>
					<p class="font-display text-sm font-extrabold leading-tight">
						Browsing {data.currentDepartment.name} ({data.currentDepartment.short_name})
					</p>
					<p class="text-[0.72rem] text-ink-soft">
						Showing community-shared notes contributed by students from this department.
					</p>
				</div>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				{#if data.enrolledDepartment}
					<a href="/notes?department={data.enrolledDepartment.id}" class="btn btn-secondary btn-sm !text-xs">
						My Department
					</a>
				{/if}
				<a href="/notes" class="btn btn-ghost btn-sm !text-xs">
					All Community
				</a>
			</div>
		</div>
	{/if}

	<!-- Content Classification Labels Indicator -->
	<div class="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-paper-card px-3.5 py-2.5">
		<span class="kicker !text-[0.62rem]">Content Labels:</span>
		<Badge status="submitted" />
		<span class="text-[0.7rem] text-ink-soft">Awaiting moderator review</span>
		<span class="text-ink-faint">·</span>
		<Badge status="verified" />
		<span class="text-[0.7rem] text-ink-soft">Reviewed by moderators</span>
		<span class="text-ink-faint">·</span>
		<Badge origin="ai" />
		<span class="text-[0.7rem] text-ink-soft">Created using reference materials</span>
	</div>

	<!-- Main Filter Form -->
	<form method="GET" class="card p-3 sm:p-4" aria-label="Filter notes" onsubmit={rememberSearch}>
		<!-- Keep active department filter if set -->
		{#if data.filters.department}
			<input type="hidden" name="department" value={data.filters.department} />
		{/if}

		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-2 sm:flex-row">
				<label class="relative min-w-0 flex-1">
					<span class="sr-only">Search notes</span>
					<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input class="input !pl-9" type="search" name="q" value={data.filters.q} placeholder="Search titles, concepts, keywords, or topics…" />
				</label>

				<!-- Department Dropdown in Filter -->
				{#if !data.filters.department}
					<label class="min-w-0 sm:w-48">
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
				{/if}

				<label class="min-w-0 sm:w-56">
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

			<!-- Secondary Filter Controls -->
			<div class="flex flex-wrap items-center gap-2">
				<label class="min-w-0 w-36 sm:w-44">
					<span class="sr-only">Topic</span>
					<select class="select" name="topic">
						<option value="">All topics</option>
						{#each filteredTopics as topic (topic.id)}
							<option value={topic.id} selected={data.filters.topic === topic.id}>{topic.name}</option>
						{/each}
					</select>
				</label>

				<label class="min-w-0 w-36 sm:w-40">
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

				<label class="min-w-0 w-36 sm:w-40">
					<span class="sr-only">Sort</span>
					<select class="select" name="sort">
						<option value="newest" selected={data.filters.sort === 'newest'}>Newest first</option>
						<option value="oldest" selected={data.filters.sort === 'oldest'}>Oldest first</option>
						<option value="popular" selected={data.filters.sort === 'popular'}>Most downloaded</option>
					</select>
				</label>

				<button
					type="button"
					class="btn btn-ghost btn-sm text-xs"
					onclick={() => (showAdvancedFilters = !showAdvancedFilters)}
				>
					<SlidersHorizontal size={13} />
					{showAdvancedFilters ? 'Fewer filters' : 'More filters…'}
				</button>

				<label class="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-ink px-2.5 py-1.5 text-[0.74rem] font-bold">
					<input type="checkbox" name="mine" value="1" checked={data.filters.mine} class="h-4 w-4 accent-[#211D31]" />
					Only mine
				</label>

				<div class="ml-auto flex items-center gap-2">
					{#if hasFilters}
						<a href={data.filters.department ? `/notes?department=${data.filters.department}` : '/notes'} class="btn btn-ghost btn-sm">
							<X size={14} /> Clear
						</a>
					{/if}
					<button type="submit" class="btn btn-ink btn-sm">
						Apply
					</button>
				</div>
			</div>

			<!-- Advanced Filters Row (Program, Year Level, Semester, Visibility) -->
			{#if showAdvancedFilters}
				<div class="mt-2 grid grid-cols-2 gap-2 border-t border-dashed border-ink/20 pt-3 sm:grid-cols-4">
					<label class="flex flex-col">
						<span class="label !text-[0.65rem]">Program / Course</span>
						<select class="select !min-h-9" name="program">
							<option value="">All programs</option>
							{#each filteredPrograms as prog (prog.id)}
								<option value={prog.id} selected={data.filters.program === prog.id}>
									{prog.code} · {prog.name}
								</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label !text-[0.65rem]">Year Level</span>
						<select class="select !min-h-9" name="year_level">
							<option value="">All years</option>
							{#each [1, 2, 3, 4, 5, 6] as yr (yr)}
								<option value={String(yr)} selected={data.filters.year_level === String(yr)}>Year {yr}</option>
							{/each}
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label !text-[0.65rem]">Semester</span>
						<select class="select !min-h-9" name="semester">
							<option value="">All semesters</option>
							<option value="1" selected={data.filters.semester === '1'}>1st Semester</option>
							<option value="2" selected={data.filters.semester === '2'}>2nd Semester</option>
						</select>
					</label>

					<label class="flex flex-col">
						<span class="label !text-[0.65rem]">Visibility</span>
						<select class="select !min-h-9" name="visibility">
							<option value="all" selected={data.filters.visibility === 'all'}>Any visibility</option>
							<option value="community" selected={data.filters.visibility === 'community'}>Community-wide</option>
							<option value="department" selected={data.filters.visibility === 'department'}>Department only</option>
						</select>
					</label>
				</div>
			{/if}
		</div>
	</form>

	{#if recentSearches.length && !data.filters.q}
		<div class="flex flex-wrap items-center gap-1.5 text-[0.7rem]" aria-label="Recent searches">
			<span class="font-semibold text-ink-soft">Recent searches:</span>
			{#each recentSearches as recent (recent)}
				<a href="/notes?q={encodeURIComponent(recent)}" class="chip chip-soft !min-h-6 !text-[0.65rem] hover:bg-marigold">{recent}</a>
			{/each}
		</div>
	{/if}

	<!-- Results header -->
	<div class="flex flex-wrap items-end justify-between gap-2">
		<div>
			<p class="kicker">{data.total} {data.total === 1 ? 'note' : 'notes'} found</p>
			{#if data.filters.q}
				<h2 class="mt-1 font-display text-xl font-extrabold">Results for “{data.filters.q}”</h2>
			{/if}
		</div>
		{#if data.filters.mine}<span class="chip chip-soft">Showing your contributions</span>{/if}
	</div>

	{#if data.isFallback}
		<div class="flex items-center gap-2 rounded-xl border-2 border-violet/30 bg-[#F4F0FF] p-3 text-xs font-semibold text-violet">
			<Lightbulb size={15} /> No exact match found for “{data.filters.q}”. Showing similar and partial matches.
		</div>
	{/if}

	{#if data.error}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] p-3 text-sm text-[#8f1c12]">{data.error}</div>
	{/if}

	{#if data.notes.length}
		<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
			{#each data.notes as note (note.id)}
				<NoteCard {note} saved={savedSet.has(note.id)} query={data.filters.q} />
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
			title={hasFilters ? 'No notes match those filters' : 'The board is waiting for notes in this scope'}
			description={hasFilters
				? 'Try a broader search, a different department, or clear the filters. Some notes may be visible only to their authors and department members.'
				: 'Share a lesson summary, reviewer or formula sheet for your department or community.'}
			icon={StickyNote}
		>
			{#if hasFilters}
				<a href={data.filters.department ? `/notes?department=${data.filters.department}` : '/notes'} class="btn btn-secondary btn-sm">
					<Filter size={14} /> Clear filters
				</a>
			{/if}
			{#if data.filters.q || data.filters.subject || data.filters.topic}
				<a href="/suggestions" class="btn btn-secondary btn-sm">
					<Lightbulb size={14} /> Suggest missing subject or topic
				</a>
			{/if}
			<a href="/notes/new" class="btn btn-primary btn-sm"><PenLine size={14} /> Write a note</a>
		</EmptyState>
	{/if}
</div>
