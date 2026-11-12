<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		AlertCircle,
		CheckCircle2,
		ChevronDown,
		Clock3,
		FileWarning,
		Flag,
		History,
		Lightbulb,
		MessageSquareWarning,
		ShieldCheck,
		StickyNote,
		Trash2,
		XCircle
	} from '@lucide/svelte';
	import { formatDate, readingTime, stripMarkdown, suggestionStatusLabel } from '$lib/utils';
	import type { SuggestionKind } from '$lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const tabs = $derived([
		{ value: 'notes' as const, label: 'Note queue', href: '/moderation', count: data.counts.notes, icon: StickyNote },
		{ value: 'suggestions' as const, label: 'Suggestions', href: '/moderation?tab=suggestions', count: data.counts.suggestions, icon: Lightbulb },
		{ value: 'reports' as const, label: 'Reports', href: '/moderation?tab=reports', count: data.counts.reports, icon: Flag },
		{ value: 'audit' as const, label: 'Audit log', href: '/moderation?tab=audit', count: data.audit.length, icon: History }
	]);

	const filteredSubjects = $derived(
		data.filters.department
			? data.subjects.filter((subject) => subject.department_id === data.filters.department)
			: data.subjects
	);

	const auditLabel = (action: string) =>
		action === 'note_verified'
			? 'Verified a note'
			: action === 'note_verified_bulk'
				? 'Verified in bulk'
				: action === 'note_rejected'
					? 'Returned a note for revision'
					: action === 'note_removed'
						? 'Removed a reported note'
						: action.startsWith('suggestion_')
							? `Suggestion ${action.replace('suggestion_', '').replace('_', ' ')}`
							: action.startsWith('report_')
								? `Report ${action.replace('report_', '')}`
								: action.replace(/_/g, ' ');

	const kindLabel = (kind: SuggestionKind) =>
		kind === 'course'
			? 'Course'
			: kind === 'subject'
				? 'Subject'
				: kind === 'lesson'
					? 'Lesson'
					: kind === 'correction'
						? 'Correction'
						: 'Platform';

	const reasonLabel = (reason: string) =>
		reason === 'incorrect'
			? 'Incorrect or misleading'
			: reason === 'not-academic'
				? 'Not academic / spam'
				: reason === 'copyright'
					? 'Copyright concern'
					: reason === 'harassment'
						? 'Unsafe or disrespectful'
						: 'Other';
</script>

<svelte:head><title>Review queue · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<header class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<p class="kicker">Moderation</p>
			<h1 class="display mt-1 text-[2rem] leading-[1.05] sm:text-[2.6rem]">Review queue</h1>
			<p class="mt-2 max-w-2xl text-[0.92rem] leading-relaxed text-ink-soft">
				Notes publish immediately. Keep the academic map trustworthy by routing curriculum suggestions, reviewing reports,
				and returning content that breaks the rules.
			</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<span class="badge badge-verified !text-[0.58rem]"><CheckCircle2 size={11} /> {data.counts.verified} published notes</span>
			<a href="/notes" class="btn btn-secondary btn-sm">Browse published notes</a>
		</div>
	</header>

	{#if form && 'success' in form && form.success}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]" role="status">
			<CheckCircle2 size={17} /> {form.message}
		</div>
	{/if}
	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {form.error}
		</div>
	{/if}

	<div class="grid grid-cols-3 gap-3">
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-marigold-soft"><StickyNote size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.notes}</p><p class="text-[0.63rem] font-semibold text-ink-soft">In review queue</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-sky"><Lightbulb size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.suggestions}</p><p class="text-[0.63rem] font-semibold text-ink-soft">Suggestions</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-coral"><Flag size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.reports}</p><p class="text-[0.63rem] font-semibold text-ink-soft">Open reports</p></div>
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
		<div class="flex flex-col gap-3 rounded-xl border-2 border-ink bg-paper-deep/50 p-3 sm:flex-row sm:items-end sm:justify-between">
			<form method="GET" action="/moderation" class="flex flex-1 flex-wrap items-end gap-2">
				<input type="hidden" name="tab" value="notes" />
				<label class="flex min-w-[9rem] flex-1 flex-col">
					<span class="label !text-[0.64rem]">Department</span>
					<select class="select !min-h-9" name="department" onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}>
						<option value="">All departments</option>
						{#each data.departments as department (department.id)}
							<option value={department.id} selected={data.filters.department === department.id}>{department.short_name}</option>
						{/each}
					</select>
				</label>
				<label class="flex min-w-[9rem] flex-1 flex-col">
					<span class="label !text-[0.64rem]">Subject</span>
					<select class="select !min-h-9" name="subject" onchange={(e) => (e.currentTarget.form as HTMLFormElement)?.submit()}>
						<option value="">All subjects</option>
						{#each filteredSubjects as subject (subject.id)}
							<option value={subject.id} selected={data.filters.subject === subject.id}>{subject.code}</option>
						{/each}
					</select>
				</label>
				{#if data.filters.department || data.filters.subject}
					<a href="/moderation" class="btn btn-ghost btn-sm">Clear filters</a>
				{/if}
			</form>
			<p class="font-mono text-[0.64rem] uppercase tracking-[0.08em] text-ink-soft">
				{data.pagination.total} waiting · page {data.pagination.page}/{data.pagination.pages}
			</p>
		</div>

		<form
			id="bulk-verify-form"
			method="POST"
			action="?/bulkVerify"
			class="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-3 py-2"
			use:enhance
		>
			<p class="text-[0.74rem] font-semibold text-[#155c3c]">Select notes below, then verify them together.</p>
			<button type="submit" class="btn btn-primary btn-sm"><CheckCircle2 size={14} /> Verify selected</button>
		</form>

		{#if data.queue.length}
			<div class="grid gap-4 xl:grid-cols-2">
				{#each data.queue as note (note.id)}
					<article class="card flex flex-col overflow-hidden">
						<div class="flex flex-col gap-2 p-4">
							<div class="flex flex-wrap items-center gap-1.5">
								<label class="flex items-center gap-1.5 rounded border-2 border-ink/30 bg-paper px-1.5 py-0.5 text-[0.6rem] font-bold">
									<input type="checkbox" name="note_ids" value={note.id} form="bulk-verify-form" class="h-3.5 w-3.5 accent-[#1C7A50]" />
									Select
								</label>
								<Badge status={note.status} origin={note.origin} />
								<span class="badge badge-neutral !text-[0.52rem]">{note.visibility === 'department' ? 'Department only' : 'Community-wide'}</span>
								{#if note.subject}<span class="chip chip-soft !min-h-5 !text-[0.6rem]">{note.subject.code}</span>{/if}
								<span class="ml-auto flex items-center gap-1 text-[0.64rem] text-ink-soft"><Clock3 size={11} /> {formatDate(note.created_at)}</span>
							</div>
							<h2 class="font-display text-[1.05rem] font-extrabold leading-tight">{note.title}</h2>
							<p class="line-clamp-2 text-[0.78rem] leading-relaxed text-ink-soft">{note.summary}</p>
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed border-ink/15 pt-2 text-[0.68rem] text-ink-soft">
								<span class="flex items-center gap-1.5">
									<Avatar name={note.author?.full_name} color={note.author?.avatar_color} size={20} />
									<span class="font-semibold text-ink">{note.author?.full_name ?? 'Unknown author'}</span>
								</span>
								{#if note.topic}<span>{note.topic.name}</span>{/if}
								<span>{readingTime(note.content)}</span>
							</div>
						</div>

						<details class="group border-t-2 border-ink">
							<summary class="flex cursor-pointer list-none items-center justify-between gap-2 bg-[#F3EDDD] px-4 py-2.5 text-[0.76rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
								<span class="flex items-center gap-1.5"><ShieldCheck size={14} /> Review this note</span>
								<ChevronDown size={15} class="transition group-open:rotate-180" />
							</summary>
							<div class="flex flex-col gap-3 p-4">
								<div class="scroll-thin max-h-52 overflow-y-auto rounded-lg border border-dashed border-ink/25 bg-paper p-3">
									<p class="whitespace-pre-line text-[0.76rem] leading-relaxed text-ink-soft">
										{stripMarkdown(note.content) || note.content_text || 'No text body. Check the attached file on the note page.'}
									</p>
								</div>
								<div class="flex flex-wrap gap-2">
									<a href="/notes/{note.id}" class="btn btn-secondary btn-sm">Open full note</a>
									{#if note.file_path}<span class="badge badge-neutral !text-[0.52rem]">Attached file</span>{/if}
								</div>

								<form
									method="POST"
									action="?/verify"
									class="flex flex-col gap-2 rounded-lg border-2 border-[#1C7A50]/40 bg-[#EFFBF3]/60 p-3"
									use:enhance
								>
									<input type="hidden" name="note_id" value={note.id} />
									<label class="flex flex-col">
										<span class="label">Verification note (optional)</span>
										<textarea class="textarea" name="moderator_note" rows="2" placeholder="Checked against course discussion. Definitions and computation correct."></textarea>
									</label>
									<button type="submit" class="btn btn-primary btn-sm"><CheckCircle2 size={14} /> Verify and publish</button>
								</form>

								<form
									method="POST"
									action="?/reject"
									class="flex flex-col gap-2 rounded-lg border-2 border-[#B42318]/35 bg-[#FFF1EF]/50 p-3"
									use:enhance
								>
									<input type="hidden" name="note_id" value={note.id} />
									<label class="flex flex-col">
										<span class="label">What needs revision?</span>
										<textarea class="textarea" name="moderator_note" rows="2" required minlength="5" placeholder="Explain exactly what the author should correct before resubmitting."></textarea>
									</label>
									<button type="submit" class="btn btn-danger btn-sm"><XCircle size={14} /> Return to author</button>
								</form>
							</div>
						</details>
					</article>
				{/each}
			</div>

			{#if data.pagination.pages > 1}
				<nav class="flex flex-wrap items-center justify-center gap-2" aria-label="Queue pagination">
					{#if data.pagination.page > 1}
						<a
							href="/moderation?tab=notes{data.filters.department ? `&department=${data.filters.department}` : ''}{data.filters.subject ? `&subject=${data.filters.subject}` : ''}&page={data.pagination.page - 1}"
							class="btn btn-secondary btn-sm">Previous</a
						>
					{/if}
					<span class="font-mono text-[0.66rem] text-ink-soft">Page {data.pagination.page} of {data.pagination.pages}</span>
					{#if data.pagination.page < data.pagination.pages}
						<a
							href="/moderation?tab=notes{data.filters.department ? `&department=${data.filters.department}` : ''}{data.filters.subject ? `&subject=${data.filters.subject}` : ''}&page={data.pagination.page + 1}"
							class="btn btn-secondary btn-sm">Next</a
						>
					{/if}
				</nav>
			{/if}
		{:else}
			<EmptyState
				title="Note queue is clear"
				description="No community notes are waiting for review. New notes publish immediately."
				icon={CheckCircle2}
			>
				<a href="/notes" class="btn btn-secondary btn-sm">Browse published notes</a>
			</EmptyState>
		{/if}
	{:else if data.tab === 'suggestions'}
		{#if data.suggestions.length}
			<div class="flex flex-col gap-4">
				{#each data.suggestions as suggestion (suggestion.id)}
					<article class="card overflow-hidden">
						<div class="flex flex-col gap-2 p-4">
							<div class="flex flex-wrap items-center gap-1.5">
								<span class="badge badge-submitted !text-[0.55rem]">{suggestionStatusLabel(suggestion.status)}</span>
								<span class="badge badge-neutral !text-[0.52rem]">{kindLabel(suggestion.kind)}</span>
								{#if suggestion.subject}<span class="chip chip-soft !min-h-5 !text-[0.6rem]">{suggestion.subject.code}</span>{/if}
								<span class="ml-auto flex items-center gap-1 text-[0.64rem] text-ink-soft"><Clock3 size={11} /> {formatDate(suggestion.created_at)}</span>
							</div>
							<h2 class="font-display text-[1.05rem] font-extrabold leading-tight">{suggestion.title}</h2>
							<p class="whitespace-pre-line text-[0.8rem] leading-relaxed text-ink-soft">{suggestion.details}</p>
							<div class="flex items-center gap-1.5 border-t border-dashed border-ink/15 pt-2 text-[0.68rem] text-ink-soft">
								<Avatar name={suggestion.user?.full_name} color={suggestion.user?.avatar_color} size={20} />
								<span class="font-semibold text-ink">{suggestion.user?.full_name ?? 'Student'}</span>
								<span>· {suggestion.user?.role ?? 'student'}</span>
							</div>
						</div>
						<form method="POST" action="?/suggestion" class="border-t-2 border-ink bg-[#F3EDDD] p-4" use:enhance>
							<input type="hidden" name="suggestion_id" value={suggestion.id} />
							<label class="flex flex-col">
								<span class="label">Note back to the student</span>
								<textarea class="textarea" name="admin_note" rows="2" placeholder="Optional: explain the decision or ask for a source."></textarea>
							</label>
							<div class="mt-2 flex flex-wrap gap-2">
								<button type="submit" name="decision" value="under_review" class="btn btn-secondary btn-sm"><Clock3 size={14} /> Under review</button>
								<button type="submit" name="decision" value="accepted" class="btn btn-primary btn-sm"><CheckCircle2 size={14} /> Accept</button>
								<button type="submit" name="decision" value="declined" class="btn btn-danger btn-sm"><XCircle size={14} /> Decline</button>
							</div>
						</form>
					</article>
				{/each}
			</div>
		{:else}
			<EmptyState title="No open suggestions" description="Students have not sent any curriculum changes that need review." icon={Lightbulb} />
		{/if}
	{:else if data.tab === 'reports'}
		{#if data.reports.length}
			<div class="flex flex-col gap-4">
				{#each data.reports as report (report.id)}
					<article class="card overflow-hidden">
						<div class="flex items-start gap-3 p-4">
							<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-coral"><FileWarning size={17} /></span>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-1.5">
									<span class="badge badge-rejected !text-[0.55rem]">{reasonLabel(report.reason)}</span>
									<span class="ml-auto flex items-center gap-1 text-[0.64rem] text-ink-soft"><Clock3 size={11} /> {formatDate(report.created_at)}</span>
								</div>
								{#if report.note}
									<a href="/notes/{report.note.id}" class="mt-1 block font-display text-[1.02rem] font-extrabold leading-tight hover:underline">
										{report.note.title}
									</a>
									<p class="text-[0.68rem] text-ink-soft">
										{report.note.subject?.code ?? 'Subject'} · by {report.note.author?.full_name ?? 'unknown author'}
									</p>
								{:else}
									<p class="mt-1 font-display text-[1.02rem] font-extrabold">Note no longer available</p>
								{/if}
								{#if report.details}
									<p class="mt-2 rounded-lg border-l-4 border-ink/30 bg-paper px-3 py-2 text-[0.78rem] leading-relaxed text-ink-soft">{report.details}</p>
								{/if}
								<p class="mt-2 flex items-center gap-1.5 text-[0.66rem] text-ink-soft">
									<Avatar name={report.reporter?.full_name} color={report.reporter?.avatar_color} size={18} />
									Reported by <strong class="text-ink">{report.reporter?.full_name ?? 'a student'}</strong>
								</p>
							</div>
						</div>
						<form method="POST" action="?/report" class="border-t-2 border-ink bg-[#F3EDDD] p-4" use:enhance>
							<input type="hidden" name="report_id" value={report.id} />
							<input type="hidden" name="note_id" value={report.note?.id ?? ''} />
							{#if report.note}
								<label class="mb-2 flex items-center gap-2 text-[0.74rem] font-semibold">
									<input type="checkbox" name="remove_note" class="h-4 w-4 accent-[#B42318]" />
									<Trash2 size={13} /> Remove the note permanently (only if the report is valid)
								</label>
							{/if}
							<div class="flex flex-wrap gap-2">
								<button type="submit" name="decision" value="resolved" class="btn btn-primary btn-sm"><CheckCircle2 size={14} /> Resolve report</button>
								<button type="submit" name="decision" value="dismissed" class="btn btn-secondary btn-sm"><XCircle size={14} /> Dismiss</button>
							</div>
						</form>
					</article>
				{/each}
			</div>
		{:else}
			<EmptyState title="No open reports" description="Nothing has been reported. Community notes are holding up well." icon={Flag} />
		{/if}
	{:else if data.tab === 'audit'}
		{#if data.audit.length}
			<div class="flex flex-col gap-2">
				{#each data.audit as entry (entry.id)}
					<div class="flex items-start gap-3 rounded-xl border-2 border-ink/20 bg-white px-3 py-2.5">
						<Avatar name={entry.actor?.full_name} color={entry.actor?.avatar_color} size={28} />
						<div class="min-w-0 flex-1">
							<p class="text-[0.78rem] font-semibold leading-snug">
								{entry.actor?.full_name ?? 'A moderator'}
								<span class="font-normal text-ink-soft">· {auditLabel(entry.action)}</span>
							</p>
							{#if entry.note}
								<a href="/notes/{entry.note.id}" class="block truncate text-[0.7rem] text-violet hover:underline">{entry.note.title}</a>
							{/if}
							{#if entry.detail}
								<p class="mt-1 line-clamp-2 rounded border-l-2 border-ink/20 pl-2 text-[0.7rem] leading-relaxed text-ink-soft">
									{entry.detail}
								</p>
							{/if}
						</div>
						<span class="shrink-0 text-right font-mono text-[0.6rem] text-ink-faint">{formatDate(entry.created_at)}</span>
					</div>
				{/each}
			</div>
			<p class="text-center text-[0.68rem] text-ink-faint">Showing the 30 most recent moderation actions.</p>
		{:else}
			<EmptyState
				title="No moderation actions yet"
				description="Verifications, returns and report decisions will be recorded here for accountability."
				icon={History}
			/>
		{/if}
	{/if}

	<div class="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/30 px-4 py-3">
		<MessageSquareWarning size={16} class="mt-0.5 shrink-0 text-ink-soft" />
		<p class="text-[0.7rem] leading-relaxed text-ink-soft">
			Verification confirms a note was checked against class discussion or a public reference. It does not make the note
			official university curriculum. Leave a short, specific verification note so students can see what was checked.
		</p>
	</div>
</div>
