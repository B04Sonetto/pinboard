<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Avatar from '$lib/components/Avatar.svelte';
	import {
		AlertTriangle,
		BookOpen,
		CheckCircle2,
		ChevronDown,
		Clock3,
		GraduationCap,
		Layers,
		Lightbulb,
		Plus,
		Search,
		ShieldCheck,
		Trash2,
		Users,
		XCircle
	} from '@lucide/svelte';
	import { formatDate, suggestionStatusLabel } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tab = $derived(
		page.url.searchParams.get('tab') === 'curriculum'
			? 'curriculum'
			: page.url.searchParams.get('tab') === 'people'
				? 'people'
				: page.url.searchParams.get('tab') === 'suggestions'
					? 'suggestions'
					: 'overview'
	);

	const tabs = [
		{ value: 'overview', label: 'Overview', href: '/admin' },
		{ value: 'curriculum', label: 'Curriculum', href: '/admin?tab=curriculum' },
		{ value: 'people', label: 'People & roles', href: '/admin?tab=people' },
		{ value: 'suggestions', label: 'Suggestions', href: '/admin?tab=suggestions' }
	];

	let userSearch = $state('');
	let subjectDepartment = $state('');
	let topicSearch = $state('');

	const programsForSubject = $derived(
		data.taxonomy.programs.filter((program) => !subjectDepartment || program.department_id === subjectDepartment)
	);
	const subjectsForTopics = $derived(
		data.taxonomy.subjects.filter((subject) => !subjectDepartment || subject.department_id === subjectDepartment)
	);

	const filteredUsers = $derived(
		data.users.filter((user) => {
			if (!userSearch.trim()) return true;
			const needle = userSearch.toLowerCase();
			return (
				user.full_name.toLowerCase().includes(needle) ||
				user.role.includes(needle) ||
				(user.department?.short_name ?? '').toLowerCase().includes(needle) ||
				(user.program?.code ?? '').toLowerCase().includes(needle)
			);
		})
	);

	const filteredTopics = $derived(
		data.taxonomy.topics.filter((topic) => {
			const subject = data.taxonomy.subjects.find((item) => item.id === topic.subject_id);
			if (subjectDepartment && subject?.department_id !== subjectDepartment) return false;
			if (!topicSearch.trim()) return true;
			const needle = topicSearch.toLowerCase();
			return topic.name.toLowerCase().includes(needle) || (subject?.code ?? '').toLowerCase().includes(needle);
		})
	);

	const subjectsByDepartment = $derived(
		data.taxonomy.departments.map((department) => ({
			department,
			subjects: data.taxonomy.subjects.filter((subject) => subject.department_id === department.id)
		}))
	);

	const roleTone = (role: string) => (role === 'admin' ? 'badge-ai' : role === 'moderator' ? 'badge-verified' : 'badge-neutral');
</script>

<svelte:head><title>Admin console · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="kicker">Administration</p>
			<h1 class="display mt-1 text-[2rem] leading-[1.05] sm:text-[2.6rem]">Admin console</h1>
			<p class="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink-soft">
				Curate the community curriculum map, assign moderator roles, and keep the academic taxonomy accurate. Changes here
				affect how every note is filed.
			</p>
		</div>
		<a href="/moderation" class="btn btn-secondary"><ShieldCheck size={16} /> Review queue</a>
	</header>

	{#if form && 'success' in form && form.success}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]" role="status">
			<CheckCircle2 size={17} /> {form.message}
		</div>
	{/if}
	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertTriangle size={17} class="mt-0.5 shrink-0" /> {form.error}
		</div>
	{/if}

	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-marigold-soft"><Users size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.users}</p><p class="text-[0.62rem] font-semibold text-ink-soft">Accounts</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-sky"><BookOpen size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.notes}</p><p class="text-[0.62rem] font-semibold text-ink-soft">Notes</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-leaf"><GraduationCap size={15} /></span>
			<div><p class="stat-value !text-xl">{data.taxonomy.subjects.length}</p><p class="text-[0.62rem] font-semibold text-ink-soft">Subjects</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-coral"><Lightbulb size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.suggestionsOpen}</p><p class="text-[0.62rem] font-semibold text-ink-soft">Open suggestions</p></div>
		</div>
	</div>

	<div class="flex flex-wrap gap-1.5 border-b-2 border-dashed border-ink/20 pb-3">
		{#each tabs as item (item.value)}
			<a href={item.href} class="tab" class:is-active={tab === item.value}>{item.label}</a>
		{/each}
	</div>

	{#if tab === 'overview'}
		<div class="grid gap-4 lg:grid-cols-3">
			<section class="card p-4 lg:col-span-2">
				<div class="flex items-center gap-2">
					<Layers size={17} />
					<h2 class="font-display text-lg font-extrabold">Curriculum map</h2>
					<a href="/admin?tab=curriculum" class="ml-auto text-[0.72rem] font-bold text-violet hover:underline">Manage →</a>
				</div>
				<div class="mt-3 grid gap-2 sm:grid-cols-2">
					{#each subjectsByDepartment as group (group.department.id)}
						<div class="rounded-lg border-2 border-ink/20 bg-paper p-3">
							<p class="flex items-center gap-1.5 text-[0.8rem] font-bold">
								<span class="h-3 w-3 rounded-sm border border-ink" style="background:{group.department.color}"></span>
								{group.department.short_name}
							</p>
							<p class="mt-0.5 text-[0.66rem] text-ink-soft">
								{group.subjects.length} subjects ·
								{data.taxonomy.programs.filter((program) => program.department_id === group.department.id).length} programs ·
								{data.taxonomy.topics.filter((topic) => group.subjects.some((subject) => subject.id === topic.subject_id)).length} topics
							</p>
						</div>
					{/each}
				</div>
			</section>

			<section class="card p-4">
				<div class="flex items-center gap-2">
					<Users size={17} />
					<h2 class="font-display text-lg font-extrabold">Roles</h2>
					<a href="/admin?tab=people" class="ml-auto text-[0.72rem] font-bold text-violet hover:underline">Manage →</a>
				</div>
				<dl class="mt-3 flex flex-col gap-2 text-[0.8rem]">
					<div class="flex items-center justify-between"><dt class="text-ink-soft">Students</dt><dd class="font-mono font-bold">{data.counts.students}</dd></div>
					<div class="flex items-center justify-between"><dt class="text-ink-soft">Moderators</dt><dd class="font-mono font-bold">{data.counts.moderators}</dd></div>
					<div class="flex items-center justify-between"><dt class="text-ink-soft">Administrators</dt><dd class="font-mono font-bold">{data.counts.admins}</dd></div>
				</dl>
			</section>

			<section class="card p-4 lg:col-span-2">
				<div class="flex items-center gap-2">
					<Clock3 size={17} />
					<h2 class="font-display text-lg font-extrabold">Newest accounts</h2>
				</div>
				<ul class="mt-2 flex flex-col divide-y divide-dashed divide-ink/15">
					{#each data.newestUsers as user (user.id)}
						<li class="flex items-center gap-2.5 py-2">
							<Avatar name={user.full_name} color={user.avatar_color} size={28} role={user.role} />
							<div class="min-w-0 flex-1">
								<p class="truncate text-[0.8rem] font-bold">{user.full_name}</p>
								<p class="text-[0.64rem] text-ink-soft">{user.program?.code ?? 'No program'} · {formatDate(user.created_at)}</p>
							</div>
							<span class="badge {roleTone(user.role)} !text-[0.52rem]">{user.role}</span>
						</li>
					{/each}
				</ul>
			</section>

			<!-- Metrics: Review Queue Health -->
			<section class="card p-4">
				<div class="flex items-center gap-2">
					<ShieldCheck size={17} class="text-[#1C7A50]" />
					<h2 class="font-display text-lg font-extrabold">Queue health</h2>
				</div>
				<div class="mt-3 flex flex-col gap-2.5 text-[0.78rem]">
					<div class="flex items-center justify-between border-b border-dashed border-ink/20 pb-2">
						<span class="text-ink-soft">Open reports</span>
						<span class="badge {data.analytics.openReports > 0 ? 'badge-rejected' : 'badge-verified'} !text-[0.6rem]">
							{data.analytics.openReports} open
						</span>
					</div>
					<div class="flex items-center justify-between border-b border-dashed border-ink/20 pb-2">
						<span class="text-ink-soft">Reports this week</span>
						<span class="font-mono text-[0.72rem] font-bold">{data.analytics.reportsLast7Days}</span>
					</div>
					<div>
						<span class="text-ink-soft block text-[0.72rem]">Oldest pending contribution</span>
						{#if data.analytics.oldestPending}
							<div class="mt-1 rounded-lg border border-ink/20 bg-paper p-2">
								<p class="font-bold line-clamp-1">{data.analytics.oldestPending.title}</p>
								<p class="text-[0.64rem] text-ink-faint">Submitted {formatDate(data.analytics.oldestPending.created_at)}</p>
								<a href="/moderation" class="link text-[0.68rem] font-bold mt-1 inline-block">Review in queue →</a>
							</div>
						{:else}
							<p class="text-[0.72rem] italic text-ink-faint mt-0.5">Queue is empty. All notes reviewed!</p>
						{/if}
					</div>
				</div>
			</section>

			<!-- Metrics: Most-Viewed Notes -->
			<section class="card p-4 lg:col-span-2">
				<div class="flex items-center gap-2">
					<BookOpen size={17} />
					<h2 class="font-display text-lg font-extrabold">Most viewed notes</h2>
				</div>
				{#if data.analytics.topNotes.length}
					<ul class="mt-2 flex flex-col divide-y divide-dashed divide-ink/15">
						{#each data.analytics.topNotes as topNote (topNote.id)}
							<li class="flex items-center justify-between gap-3 py-2 text-[0.78rem]">
								<div class="min-w-0 flex-1">
									<a href="/notes/{topNote.id}" class="font-bold line-clamp-1 hover:underline">{topNote.title}</a>
									<span class="text-[0.66rem] text-ink-soft">{topNote.subject?.code ?? 'General'}</span>
								</div>
								<div class="flex items-center gap-2.5 font-mono text-[0.68rem] text-ink-soft shrink-0">
									<span>{topNote.views} views</span>
									<span>{topNote.downloads} dl</span>
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-[0.74rem] text-ink-soft italic">No view metrics recorded yet.</p>
				{/if}
			</section>

			<!-- Metrics: Top & Zero-Hit Searches -->
			<section class="card p-4">
				<div class="flex items-center gap-2">
					<Search size={17} />
					<h2 class="font-display text-lg font-extrabold">Search trends</h2>
				</div>
				{#if data.analytics.topSearches.length}
					<ul class="mt-2 flex flex-col divide-y divide-dashed border-ink/15 text-[0.74rem]">
						{#each data.analytics.topSearches as searchItem (searchItem.query)}
							<li class="flex items-center justify-between py-1.5">
								<span class="font-mono font-medium truncate max-w-[160px]">“{searchItem.query}”</span>
								<span class="text-[0.65rem] font-mono shrink-0">
									{searchItem.hits} hits
									{#if searchItem.zero_hits > 0}
										<span class="text-[#B42318]">({searchItem.zero_hits} 0-hit)</span>
									{/if}
								</span>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-[0.74rem] text-ink-soft italic">No search logs yet.</p>
				{/if}
			</section>

			<section class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.8rem] font-bold"><AlertTriangle size={15} /> Admin responsibility</p>
				<p class="mt-1 text-[0.72rem] leading-relaxed text-ink-soft">
					This catalog is maintained for LSPU students. When adding subjects, follow the university's public course
					listings and keep entries labeled honestly. Deleting taxonomy cascades to notes and topics.
				</p>
			</section>
		</div>
	{:else if tab === 'curriculum'}
		<div class="grid gap-5 xl:grid-cols-2">
			<div class="flex flex-col gap-5">
				<section class="card overflow-hidden">
					<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
						<Layers size={17} />
						<h2 class="font-display text-lg font-extrabold">Departments & programs</h2>
						<span class="ml-auto font-mono text-[0.6rem] text-ink-soft">{data.taxonomy.departments.length} depts</span>
					</div>
					<div class="flex flex-col gap-3 p-4">
						{#each data.taxonomy.departments as department (department.id)}
							<div class="rounded-lg border-2 border-ink/25 bg-paper p-3">
								<div class="flex flex-wrap items-center gap-2">
									<span class="h-3.5 w-3.5 rounded-sm border border-ink" style="background:{department.color}"></span>
									<p class="text-[0.82rem] font-bold">{department.short_name} · {department.name}</p>
									<span class="ml-auto font-mono text-[0.55rem] text-ink-faint">{department.id}</span>
								</div>
								<ul class="mt-2 flex flex-col gap-1">
									{#each data.taxonomy.programs.filter((program) => program.department_id === department.id) as program (program.id)}
										<li class="flex items-center gap-2 text-[0.72rem]">
											<span class="badge badge-neutral !text-[0.5rem]">{program.code}</span>
											<span class="min-w-0 flex-1 truncate">{program.name}</span>
											<form
												method="POST"
												action="?/taxonomyDelete"
												use:enhance={({ cancel }) => {
													if (!confirm(`Delete program ${program.code}?`)) {
														cancel();
														return;
													}
													return async ({ update }) => {
														await update();
													};
												}}
											>
												<input type="hidden" name="type" value="programs" />
												<input type="hidden" name="id" value={program.id} />
												<button type="submit" class="rounded p-1 text-[#B42318] hover:bg-[#FFF1EF]" aria-label="Delete {program.code}"><Trash2 size={12} /></button>
											</form>
										</li>
									{/each}
									{#if !data.taxonomy.programs.some((program) => program.department_id === department.id)}
										<li class="text-[0.68rem] italic text-ink-faint">No programs yet.</li>
									{/if}
								</ul>
							</div>
						{/each}
					</div>
				</section>

				<details class="card overflow-hidden">
					<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.82rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
						<Plus size={15} /> Add department
						<ChevronDown size={15} class="ml-auto" />
					</summary>
					<form method="POST" action="?/department" class="flex flex-col gap-3 border-t-2 border-ink p-4" use:enhance>
						<div class="grid gap-3 sm:grid-cols-2">
							<label class="flex flex-col"><span class="label">Name</span><input class="input" name="name" required placeholder="Computer Studies" /></label>
							<label class="flex flex-col"><span class="label">Short name</span><input class="input" name="short_name" required maxlength="6" placeholder="CS" /></label>
							<label class="flex flex-col"><span class="label">Id (optional)</span><input class="input" name="id" placeholder="cs" pattern={"[a-z0-9-]{2,24}"} /></label>
							<label class="flex flex-col"><span class="label">Color</span><input class="input h-11 !p-1" type="color" name="color" value="#FFD34D" /></label>
						</div>
						<label class="flex flex-col"><span class="label">Description</span><textarea class="textarea" name="description" rows="2"></textarea></label>
						<input type="hidden" name="sort_order" value="99" />
						<button type="submit" class="btn btn-primary btn-sm"><Plus size={14} /> Add department</button>
					</form>
				</details>

				<details class="card overflow-hidden">
					<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.82rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
						<Plus size={15} /> Add program
						<ChevronDown size={15} class="ml-auto" />
					</summary>
					<form method="POST" action="?/program" class="flex flex-col gap-3 border-t-2 border-ink p-4" use:enhance>
						<label class="flex flex-col">
							<span class="label">Department</span>
							<select class="select" name="department_id" required>
								<option value="">Choose department</option>
								{#each data.taxonomy.departments as department (department.id)}<option value={department.id}>{department.short_name}</option>{/each}
							</select>
						</label>
						<div class="grid gap-3 sm:grid-cols-[1fr_130px]">
							<label class="flex flex-col"><span class="label">Program name</span><input class="input" name="name" required placeholder="BS Information Technology" /></label>
							<label class="flex flex-col"><span class="label">Code</span><input class="input" name="code" required maxlength="12" placeholder="BSIT" /></label>
						</div>
						<label class="flex flex-col"><span class="label">Description</span><textarea class="textarea" name="description" rows="2"></textarea></label>
						<button type="submit" class="btn btn-primary btn-sm"><Plus size={14} /> Add program</button>
					</form>
				</details>
			</div>

			<div class="flex flex-col gap-5">
				<section class="card overflow-hidden">
					<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
						<BookOpen size={17} />
						<h2 class="font-display text-lg font-extrabold">Subjects</h2>
						<select class="select ml-auto !min-h-8 !w-auto !py-0 !text-[0.7rem]" bind:value={subjectDepartment}>
							<option value="">All departments</option>
							{#each data.taxonomy.departments as department (department.id)}<option value={department.id}>{department.short_name}</option>{/each}
						</select>
					</div>
					<div class="scroll-thin max-h-[28rem] overflow-y-auto">
						<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
							{#each data.taxonomy.subjects.filter((subject) => !subjectDepartment || subject.department_id === subjectDepartment) as subject (subject.id)}
								<li class="flex items-center gap-2 px-4 py-2">
									<span class="badge badge-neutral !text-[0.5rem]">{subject.code || '—'}</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-[0.76rem] font-semibold">{subject.name}</span>
										<span class="text-[0.6rem] text-ink-faint">Year {subject.year_level ?? '—'} · Sem {subject.semester ?? '—'}</span>
									</span>
									<form
										method="POST"
										action="?/taxonomyDelete"
										use:enhance={({ cancel }) => {
											if (!confirm(`Delete subject ${subject.code} and all of its topics and notes?`)) {
												cancel();
												return;
											}
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="type" value="subjects" />
										<input type="hidden" name="id" value={subject.id} />
										<button type="submit" class="rounded p-1 text-[#B42318] hover:bg-[#FFF1EF]" aria-label="Delete {subject.code}"><Trash2 size={12} /></button>
									</form>
								</li>
							{/each}
						</ul>
					</div>
				</section>

				<details class="card overflow-hidden">
					<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.82rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
						<Plus size={15} /> Add subject
						<ChevronDown size={15} class="ml-auto" />
					</summary>
					<form method="POST" action="?/subject" class="flex flex-col gap-3 border-t-2 border-ink p-4" use:enhance>
						<div class="grid gap-3 sm:grid-cols-2">
							<label class="flex flex-col">
								<span class="label">Department</span>
								<select class="select" name="department_id" bind:value={subjectDepartment} required>
									<option value="">Choose department</option>
									{#each data.taxonomy.departments as department (department.id)}<option value={department.id}>{department.short_name}</option>{/each}
								</select>
							</label>
							<label class="flex flex-col">
								<span class="label">Program (optional)</span>
								<select class="select" name="program_id">
									<option value="">No program</option>
									{#each programsForSubject as program (program.id)}<option value={program.id}>{program.code}</option>{/each}
								</select>
							</label>
							<label class="flex flex-col"><span class="label">Code</span><input class="input" name="code" required maxlength="16" placeholder="DBMS101" /></label>
							<label class="flex flex-col"><span class="label">Subject name</span><input class="input" name="name" required placeholder="Database Management" /></label>
							<label class="flex flex-col">
								<span class="label">Year level</span>
								<select class="select" name="year_level">
									<option value="">Any</option>
									{#each [1, 2, 3, 4, 5, 6] as year (year)}<option value={String(year)}>Year {year}</option>{/each}
								</select>
							</label>
							<label class="flex flex-col">
								<span class="label">Semester</span>
								<select class="select" name="semester">
									<option value="">Any</option>
									<option value="1">1st</option>
									<option value="2">2nd</option>
								</select>
							</label>
						</div>
						<label class="flex flex-col"><span class="label">Description</span><textarea class="textarea" name="description" rows="2"></textarea></label>
						<button type="submit" class="btn btn-primary btn-sm"><Plus size={14} /> Add subject</button>
					</form>
				</details>

				<section class="card overflow-hidden">
					<div class="flex flex-wrap items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
						<Layers size={17} />
						<h2 class="font-display text-lg font-extrabold">Topics</h2>
						<label class="relative ml-auto">
							<span class="sr-only">Search topics</span>
							<Search size={13} class="absolute left-2 top-1/2 -translate-y-1/2 text-ink-soft" />
							<input class="input !min-h-8 !w-36 !py-0 !pl-7 !text-[0.7rem]" type="search" bind:value={topicSearch} placeholder="Filter topics…" />
						</label>
					</div>
					<div class="scroll-thin max-h-[24rem] overflow-y-auto">
						<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
							{#each filteredTopics as topic (topic.id)}
								{@const subject = data.taxonomy.subjects.find((item) => item.id === topic.subject_id)}
								<li class="flex items-center gap-2 px-4 py-2">
									<span class="badge badge-neutral !text-[0.5rem]">{subject?.code ?? '—'}</span>
									<span class="min-w-0 flex-1 truncate text-[0.74rem] font-semibold">{topic.name}</span>
									<form
										method="POST"
										action="?/taxonomyDelete"
										use:enhance={({ cancel }) => {
											if (!confirm(`Delete topic “${topic.name}”?`)) {
												cancel();
												return;
											}
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="type" value="topics" />
										<input type="hidden" name="id" value={topic.id} />
										<button type="submit" class="rounded p-1 text-[#B42318] hover:bg-[#FFF1EF]" aria-label="Delete {topic.name}"><Trash2 size={12} /></button>
									</form>
								</li>
							{/each}
						</ul>
					</div>
				</section>

				<details class="card overflow-hidden">
					<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.82rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
						<Plus size={15} /> Add topic
						<ChevronDown size={15} class="ml-auto" />
					</summary>
					<form method="POST" action="?/topic" class="flex flex-col gap-3 border-t-2 border-ink p-4" use:enhance>
						<label class="flex flex-col">
							<span class="label">Subject</span>
							<select class="select" name="subject_id" required>
								<option value="">Choose subject</option>
								{#each subjectsForTopics as subject (subject.id)}<option value={subject.id}>{subject.code} · {subject.name}</option>{/each}
							</select>
						</label>
						<label class="flex flex-col"><span class="label">Topic name</span><input class="input" name="name" required placeholder="Normalization" /></label>
						<label class="flex flex-col"><span class="label">Description</span><textarea class="textarea" name="description" rows="2"></textarea></label>
						<button type="submit" class="btn btn-primary btn-sm"><Plus size={14} /> Add topic</button>
					</form>
				</details>
			</div>
		</div>
	{:else if tab === 'people'}
		<section class="card overflow-hidden">
			<div class="flex flex-wrap items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
				<Users size={17} />
				<h2 class="font-display text-lg font-extrabold">People & roles</h2>
				<span class="ml-auto font-mono text-[0.6rem] text-ink-soft">{filteredUsers.length} shown</span>
			</div>
			<div class="border-b border-dashed border-ink/20 p-3">
				<label class="relative block">
					<span class="sr-only">Search people</span>
					<Search size={15} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input class="input !pl-9" type="search" bind:value={userSearch} placeholder="Search by name, role, department or program…" />
				</label>
			</div>
			<div class="scroll-thin max-h-[40rem] overflow-y-auto">
				<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
					{#each filteredUsers as user (user.id)}
						<li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
							<Avatar name={user.full_name} color={user.avatar_color} size={32} role={user.role} />
							<div class="min-w-0 flex-1">
								<p class="truncate text-[0.82rem] font-bold">{user.full_name}</p>
								<p class="text-[0.64rem] text-ink-soft">
									{user.program?.code ?? 'No program'} · {user.department?.short_name ?? 'No dept'} · joined {formatDate(user.created_at)}
								</p>
							</div>
							<span class="badge {roleTone(user.role)} !text-[0.52rem]">{user.role}</span>
							<form method="POST" action="?/role" class="flex items-center gap-1.5" use:enhance>
								<input type="hidden" name="user_id" value={user.id} />
								<select class="select !min-h-8 !w-auto !py-0 !text-[0.7rem]" name="role" disabled={user.id === data.user?.id}>
									<option value="student" selected={user.role === 'student'}>Student</option>
									<option value="moderator" selected={user.role === 'moderator'}>Moderator</option>
									<option value="admin" selected={user.role === 'admin'}>Admin</option>
								</select>
								<button type="submit" class="btn btn-secondary btn-sm" disabled={user.id === data.user?.id}>Save</button>
							</form>
						</li>
					{/each}
				</ul>
			</div>
			<div class="border-t-2 border-ink bg-paper-deep/60 px-4 py-2.5 text-[0.68rem] text-ink-soft">
				You cannot change your own role. Promote at least one other account to admin before leaving this page.
			</div>
		</section>
	{:else}
		{#if data.suggestions.length}
			<div class="flex flex-col gap-4">
				{#each data.suggestions as suggestion (suggestion.id)}
					<article class="card overflow-hidden">
						<div class="flex flex-col gap-2 p-4">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="badge {suggestion.status === 'accepted' ? 'badge-verified' : suggestion.status === 'declined' ? 'badge-rejected' : 'badge-submitted'} !text-[0.52rem]">
									{suggestionStatusLabel(suggestion.status)}
								</span>
								<span class="badge badge-neutral !text-[0.5rem]">{suggestion.kind}</span>
								{#if suggestion.subject}<span class="chip chip-soft !min-h-5 !text-[0.6rem]">{suggestion.subject.code}</span>{/if}
								<span class="ml-auto text-[0.64rem] text-ink-soft">{formatDate(suggestion.created_at)}</span>
							</div>
							<h2 class="font-display text-[1rem] font-extrabold leading-tight">{suggestion.title}</h2>
							<p class="text-[0.78rem] leading-relaxed text-ink-soft">{suggestion.details}</p>
							<div class="flex items-center gap-1.5 border-t border-dashed border-ink/15 pt-2 text-[0.66rem] text-ink-soft">
								<Avatar name={suggestion.user?.full_name} color={suggestion.user?.avatar_color} size={18} />
								<span class="font-semibold text-ink">{suggestion.user?.full_name ?? 'Student'}</span>
								{#if suggestion.admin_note}<span class="ml-auto line-clamp-1 italic">Note: {suggestion.admin_note}</span>{/if}
							</div>
						</div>
						<form method="POST" action="?/suggestion" class="flex flex-col gap-2 border-t-2 border-ink bg-[#F3EDDD] p-4 sm:flex-row sm:items-end" use:enhance>
							<input type="hidden" name="suggestion_id" value={suggestion.id} />
							<label class="flex flex-1 flex-col">
								<span class="label">Moderator note</span>
								<input class="input" name="admin_note" placeholder="Optional decision note" />
							</label>
							<div class="flex flex-wrap gap-1.5">
								<button type="submit" name="decision" value="under_review" class="btn btn-secondary btn-sm"><Clock3 size={13} /> Review</button>
								<button type="submit" name="decision" value="accepted" class="btn btn-primary btn-sm"><CheckCircle2 size={13} /> Accept</button>
								<button type="submit" name="decision" value="declined" class="btn btn-danger btn-sm"><XCircle size={13} /> Decline</button>
							</div>
						</form>
					</article>
				{/each}
			</div>
		{:else}
			<div class="rounded-2xl border-2 border-dashed border-ink/40 bg-paper-card/70 px-6 py-14 text-center">
				<Lightbulb size={24} class="mx-auto text-ink-faint" />
				<h3 class="mt-2 font-display text-xl font-extrabold">No suggestions yet</h3>
				<p class="mt-1 text-sm text-ink-soft">Student curriculum suggestions will appear here for review.</p>
			</div>
		{/if}
	{/if}
</div>
