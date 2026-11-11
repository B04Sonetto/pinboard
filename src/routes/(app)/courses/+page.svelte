<script lang="ts">
	import type { PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import { BookOpen, GraduationCap, Layers3, Search, StickyNote, X } from '@lucide/svelte';
	import { semesterLabel } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	function noteCount(subject: (typeof data.subjects)[number]) {
		return subject.notes?.[0]?.count ?? 0;
	}
	function topicCount(subject: (typeof data.subjects)[number]) {
		return subject.topics?.[0]?.count ?? 0;
	}
</script>

<svelte:head><title>Courses & Lessons · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Community-built curriculum"
		title="Courses & lessons"
		description="A student-maintained map of subjects, topics and notes. This is not the official university catalog — confirm your actual curriculum with your department."
	>
		<a href="/suggestions" class="btn btn-secondary">Suggest a course</a>
		<a href="/notes/new" class="btn btn-primary">Write a note</a>
	</PageHeader>

	<div class="flex items-start gap-2 rounded-xl border-2 border-ink bg-[#F3EDDD] px-4 py-3">
		<GraduationCap size={18} class="mt-0.5 shrink-0" />
		<p class="text-[0.8rem] leading-relaxed text-ink-soft">
			<strong class="text-ink">Community-submitted curriculum.</strong> Programs, subjects and topics are contributed by
			students to organize notes. They may differ from the official prospectus or current semester offerings.
		</p>
	</div>

	<form method="GET" class="card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:p-4">
		<label class="relative min-w-0 flex-1">
			<span class="sr-only">Search courses</span>
			<Search size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
			<input class="input !pl-9" type="search" name="q" value={data.filters.q} placeholder="Search subject code, name or program…" />
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
		<label class="sm:w-36">
			<span class="sr-only">Year level</span>
			<select class="select" name="year">
				<option value="">All year levels</option>
				{#each [1, 2, 3, 4, 5, 6] as year (year)}
					<option value={String(year)} selected={data.filters.year === String(year)}>Year {year}</option>
				{/each}
			</select>
		</label>
		<button type="submit" class="btn btn-ink btn-sm">Filter</button>
		{#if data.filters.q || data.filters.department || data.filters.year}
			<a href="/courses" class="btn btn-ghost btn-sm"><X size={14} /> Clear</a>
		{/if}
	</form>

	{#if data.groups.length}
		<div class="flex flex-col gap-9">
			{#each data.groups as group (group.department.id)}
				<section>
					<div class="mb-4 flex flex-wrap items-center gap-2 border-b-2 border-ink pb-2.5">
						<span class="h-5 w-5 rounded border-2 border-ink" style="background:{group.department.color}"></span>
						<h2 class="font-display text-2xl font-extrabold">{group.department.name}</h2>
						<span class="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-ink-faint">{group.department.short_name}</span>
						<p class="ml-auto max-w-md text-right text-[0.7rem] leading-snug text-ink-soft">{group.department.description}</p>
					</div>

					<div class="flex flex-col gap-5">
						{#each group.programs as programGroup (programGroup.program?.id ?? 'general')}
							<div>
								<div class="mb-2 flex flex-wrap items-center gap-2">
									<h3 class="font-display text-base font-extrabold">{programGroup.program?.name ?? 'General subjects'}</h3>
									{#if programGroup.program}<span class="badge badge-neutral">{programGroup.program.code}</span>{/if}
									<span class="text-[0.68rem] text-ink-faint">{programGroup.subjects.length} subjects</span>
								</div>
								<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
									{#each programGroup.subjects as subject (subject.id)}
										<a href="/courses/{subject.id}" class="card card-hover group flex flex-col gap-2 p-4">
											<div class="flex items-center justify-between gap-2">
												<span class="badge" style="background:{group.department.color}">{subject.code}</span>
												<span class="font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">
													{subject.year_level ? `Y${subject.year_level}` : '—'} · {subject.semester ? `S${subject.semester}` : '—'}
												</span>
											</div>
											<h4 class="font-display text-[1.02rem] font-extrabold leading-snug group-hover:underline">{subject.name}</h4>
											{#if subject.description}
												<p class="line-clamp-2 text-[0.74rem] leading-relaxed text-ink-soft">{subject.description}</p>
											{/if}
											<div class="mt-auto flex flex-wrap items-center gap-3 border-t border-dashed border-ink/15 pt-2.5 text-[0.66rem] font-bold text-ink-soft">
												<span class="flex items-center gap-1"><StickyNote size={11} /> {noteCount(subject)} notes</span>
												<span class="flex items-center gap-1"><Layers3 size={11} /> {topicCount(subject)} topics</span>
												<span class="ml-auto text-violet group-hover:underline">Open →</span>
											</div>
										</a>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/each}
		</div>
	{:else}
		<EmptyState
			title="No courses match that search"
			description="Try another department, year level or keyword. If a subject is missing, suggest it and an administrator can add it."
			icon={BookOpen}
		>
			<a href="/courses" class="btn btn-secondary btn-sm">Show all courses</a>
			<a href="/suggestions" class="btn btn-primary btn-sm">Suggest a subject</a>
		</EmptyState>
	{/if}

	<p class="border-t-2 border-dashed border-ink/20 pt-4 text-[0.68rem] leading-relaxed text-ink-soft">
		Official curriculum questions should go to your registrar or department office. Pinboard does not replace official
		academic advising.
	</p>
</div>
