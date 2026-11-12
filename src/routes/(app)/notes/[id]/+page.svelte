<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import Markdown from '$lib/components/Markdown.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import BookmarkButton from '$lib/components/BookmarkButton.svelte';
	import NoteCard from '$lib/components/NoteCard.svelte';
	import {
		AlertTriangle,
		ArrowLeft,
		ArrowRight,
		CheckCircle2,
		Copy,
		Download,
		ExternalLink,
		Eye,
		FileText,
		Flag,
		History,
		MessageSquareWarning,
		PenLine,
		Quote,
		ShieldCheck,
		Sparkles,
		Trash2,
		XCircle
	} from '@lucide/svelte';
	import {
		citationFor,
		formatBytes,
		formatDate,
		readingTime,
		safeHttpUrl,
		semesterLabel,
		yearLabel
	} from '$lib/utils';
	import type { CitationStyle } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let reporting = $state(false);
	let citationStyle = $state<CitationStyle>('apa');
	let copiedCitation = $state(false);

	const note = $derived(data.note);
	const relatedSet = $derived(new Set(data.savedIds));
	const sourceUrl = $derived(safeHttpUrl(note.source_url));
	const citation = $derived(
		citationFor(note, citationStyle, `${page.url.origin}/notes/${note.id}`)
	);
	const studyHref = $derived(
		`/study?notes=${note.id}${note.subject_id ? `&subject=${note.subject_id}` : ''}${note.topic_id ? `&topic=${note.topic_id}` : ''}`
	);

	async function copyCitation() {
		try {
			await navigator.clipboard.writeText(citation);
			copiedCitation = true;
			setTimeout(() => (copiedCitation = false), 2200);
		} catch {
			copiedCitation = false;
		}
	}
</script>

<svelte:head>
	<title>{note.title} · Pinboard</title>
	<meta name="description" content={note.summary || note.title} />
</svelte:head>

<div class="flex flex-col gap-5">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft" aria-label="Breadcrumb">
		<a href="/notes" class="hover:text-ink hover:underline">Community Notes</a>
		<span class="text-ink-faint">/</span>
		{#if note.department}<a href="/notes?department={note.department_id}" class="hover:text-ink hover:underline">{note.department.short_name}</a><span class="text-ink-faint">/</span>{/if}
		{#if note.subject}<a href="/courses/{note.subject_id}" class="hover:text-ink hover:underline">{note.subject.code}</a><span class="text-ink-faint">/</span>{/if}
		<span class="truncate text-ink">{note.title}</span>
	</nav>

	{#if data.notice === 'verified'}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]">
			<CheckCircle2 size={17} /> Note verified and now visible to the community.
		</div>
	{:else if data.notice === 'returned'}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]">
			<XCircle size={17} /> Note returned to the author for revision.
		</div>
	{:else if data.notice === 'published' || data.notice === 'submitted'}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]">
			<CheckCircle2 size={17} /> Note published. It is now visible to the community.
		</div>
	{:else if data.notice === 'edited'}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]">
			<CheckCircle2 size={17} /> Changes saved and published.
		</div>
	{/if}

	{#if note.revision_of}
		<div class="flex flex-wrap items-center gap-2 rounded-xl border-2 border-ink bg-[#F4F0FF] px-4 py-2.5 text-[0.78rem] font-semibold">
			<History size={15} class="text-violet" />
			This is a revision built from an earlier note.
			<a href="/notes/{note.revision_of}" class="link">View the original</a>
		</div>
	{/if}

	{#if form && 'actionError' in form && form.actionError}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]">{form.actionError}</div>
	{/if}

	{#if note.status === 'rejected' && (data.isAuthor || data.canModerate) && note.moderator_note}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] p-4">
			<p class="flex items-center gap-2 text-sm font-bold text-[#8f1c12]"><MessageSquareWarning size={16} /> Moderator feedback</p>
			<p class="mt-1 text-[0.82rem] leading-relaxed text-[#6f1a12]">{note.moderator_note}</p>
		</div>
	{/if}

	<header class="flex flex-col gap-4">
		<div class="flex flex-wrap items-center gap-2">
			<Badge status={note.status} origin={note.origin} />
			{#if note.visibility === 'department'}
				<span class="badge border-ink !bg-amber-100 !text-amber-950" title="Visible only to {note.department?.name ?? 'department'} students">
					🔒 {note.department?.short_name ?? 'Department'} only
				</span>
			{:else}
				<span class="badge border-ink !bg-emerald-100 !text-emerald-950" title="Visible university-wide across all departments">
					🌐 Community-wide
				</span>
			{/if}
			{#if note.department}
				<a href="/notes?department={note.department.id}" class="chip chip-soft !min-h-6 !text-[0.66rem] hover:border-ink">
					{note.department.short_name}
				</a>
			{/if}
			{#if note.subject}<span class="chip chip-soft !min-h-6 !text-[0.66rem]">{note.subject.code}</span>{/if}
			{#if note.topic}<span class="chip !min-h-6 !text-[0.66rem]">{note.topic.name}</span>{/if}
		</div>
		<h1 class="display max-w-4xl text-[2rem] leading-[1.06] sm:text-[2.7rem]">{note.title}</h1>
		<p class="max-w-3xl text-[0.98rem] leading-relaxed text-ink-soft">{note.summary}</p>

		<div class="flex flex-wrap items-center gap-x-5 gap-y-2 border-t-2 border-dashed border-ink/20 pt-3 text-[0.74rem] text-ink-soft">
			<span class="flex items-center gap-1.5">
				<Avatar name={note.author?.full_name} color={note.author?.avatar_color} size={26} role={note.author?.role} />
				<span class="font-bold text-ink">{note.author?.full_name ?? 'Student contributor'}</span>
			</span>
			<span>{formatDate(note.created_at)}</span>
			<span>{readingTime(note.content)}</span>
			<span class="flex items-center gap-1"><Eye size={13} /> {note.views} views</span>
			<span class="flex items-center gap-1"><Download size={13} /> {note.downloads} downloads</span>
			{#if note.status === 'verified' && note.verified_by && note.verified_at}
				<span class="flex items-center gap-1 font-semibold text-[#155c3c]" title="Checked by a moderator">
					<ShieldCheck size={14} class="text-[#1C7A50]" />
					Verified{#if note.verifier} by {note.verifier.full_name}{#if note.verifier.role !== 'student'} ({note.verifier.role}){/if}{/if} · {formatDate(note.verified_at)}
				</span>
			{/if}
		</div>
	</header>

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
		<article class="min-w-0">
			<!-- Academic Provenance Disclaimer -->
			<div class="mb-4 flex items-start gap-2.5 rounded-xl border-2 border-ink/20 bg-[#F3EDDD] px-4 py-3 text-[0.74rem] text-ink-soft">
				<AlertTriangle size={16} class="mt-0.5 shrink-0 text-amber-700" />
				<p>
					<strong class="font-bold text-ink">Shared by an LSPU student.</strong> This is peer study material for Laguna State Polytechnic University, not a registrar handout. Check formulas, dates, and definitions against your syllabus.
				</p>
			</div>

			<div class="note-sheet px-5 py-6 sm:px-8 sm:py-8">
				<span class="absolute right-5 top-0 h-3 w-16 -translate-y-1/2 rotate-[-4deg] bg-[#FFF1B5]/90" aria-hidden="true"></span>

				{#if note.summary}
					<div class="mb-6 rounded-xl border-2 border-ink bg-marigold-soft p-4">
						<p class="kicker !text-[0.6rem]">Quick summary</p>
						<p class="mt-1.5 text-[0.88rem] font-medium leading-relaxed">{note.summary}</p>
					</div>
				{/if}

				{#if note.content}
					<Markdown content={note.content} />
				{:else if note.content_text}
					<p class="prose-pinboard whitespace-pre-line">{note.content_text}</p>
				{:else}
					<p class="text-sm text-ink-soft">The author attached a file without pasting the note body.</p>
				{/if}

				{#if note.keywords?.length}
					<div class="mt-8 border-t-2 border-dashed border-ink/20 pt-4">
						<p class="kicker !text-[0.6rem]">Keywords</p>
						<div class="mt-2 flex flex-wrap gap-1.5">
							{#each note.keywords as keyword (keyword)}
								<a href="/notes?q={encodeURIComponent(keyword)}" class="chip chip-soft !min-h-6 !text-[0.68rem] hover:bg-marigold-soft">#{keyword}</a>
							{/each}
						</div>
					</div>
				{/if}

				{#if note.file_path}
					<div class="mt-8 flex flex-col gap-3 rounded-xl border-2 border-ink bg-paper p-4 sm:flex-row sm:items-center">
						<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#BFE0FF]">
							<FileText size={19} />
						</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-bold">{note.file_name ?? 'Attached file'}</p>
							<p class="text-[0.7rem] text-ink-soft">
								{note.file_type?.toUpperCase() ?? 'File'} · {formatBytes(note.file_size)}
							</p>
						</div>
						<a href="/api/download/{note.id}" class="btn btn-secondary btn-sm shrink-0"><Download size={15} /> Download</a>
					</div>
				{/if}
			</div>

			{#if data.canModerate}
				<section class="card mt-5 overflow-hidden">
					<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-2.5">
						<ShieldCheck size={17} />
						<h2 class="font-display text-base font-extrabold">Moderator tools</h2>
						<span class="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-soft">status: {note.status}</span>
					</div>
					<div class="grid gap-4 p-4 sm:grid-cols-2">
						<form method="POST" action="?/verify" class="flex flex-col gap-2" use:enhance>
							<label class="flex flex-col">
								<span class="label">Verification note (optional)</span>
								<textarea class="textarea" name="moderator_note" rows="3" placeholder="Checked against class discussion. Computation correct."></textarea>
							</label>
							<button type="submit" class="btn btn-primary btn-sm"><CheckCircle2 size={15} /> Verify note</button>
						</form>
						<form method="POST" action="?/reject" class="flex flex-col gap-2" use:enhance>
							<label class="flex flex-col">
								<span class="label">What needs revision?</span>
								<textarea class="textarea" name="moderator_note" rows="3" placeholder="Explain what the author should fix before resubmitting."></textarea>
							</label>
							<button type="submit" class="btn btn-danger btn-sm"><XCircle size={15} /> Return to author</button>
						</form>
					</div>
				</section>
			{/if}

			{#if data.related.length}
				<section class="mt-7">
					<div class="mb-3 flex items-end justify-between">
						<div>
							<p class="kicker">Shared subject or keywords</p>
							<h2 class="mt-1 font-display text-xl font-extrabold">Related notes</h2>
						</div>
						<a href="/notes?subject={note.subject_id}" class="link text-[0.78rem]">See all</a>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each data.related as related (related.id)}
							<NoteCard note={related} saved={relatedSet.has(related.id)} />
						{/each}
					</div>
				</section>
			{/if}
		</article>

		<aside class="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
			<div class="card p-4">
				<div class="flex flex-wrap gap-2">
					<BookmarkButton noteId={note.id} saved={data.saved} />
					<a href="/api/download/{note.id}" class="btn btn-secondary btn-sm"><Download size={15} /> Download</a>
				</div>
				{#if note.status === 'verified'}
					<a href={studyHref} class="btn btn-primary mt-2 w-full">
						<Sparkles size={16} /> Build study material
					</a>
					<p class="mt-2 text-center text-[0.65rem] leading-relaxed text-ink-faint">
						Uses only the notes you select. AI output is labeled and may omit details.
					</p>
				{:else}
					<p class="mt-2 rounded-lg border border-dashed border-ink/25 bg-paper px-2.5 py-2 text-center text-[0.68rem] leading-relaxed text-ink-soft">
						Study material becomes available once this note is published.
					</p>
				{/if}
			</div>

			<div class="card p-4">
				<p class="kicker !text-[0.6rem]">Note details</p>
				<dl class="mt-2 flex flex-col gap-1.5 text-[0.76rem]">
					<div class="flex items-start justify-between gap-3"><dt class="text-ink-soft">Department</dt><dd class="text-right font-semibold">{note.department?.name ?? '—'}</dd></div>
					<div class="flex items-start justify-between gap-3"><dt class="text-ink-soft">Subject</dt><dd class="text-right font-semibold">{note.subject ? `${note.subject.code} · ${note.subject.name}` : '—'}</dd></div>
					{#if note.topic}<div class="flex items-start justify-between gap-3"><dt class="text-ink-soft">Topic</dt><dd class="text-right font-semibold">{note.topic.name}</dd></div>{/if}
					<div class="flex items-center justify-between gap-3"><dt class="text-ink-soft">Year level</dt><dd class="font-semibold">{yearLabel(note.year_level)}</dd></div>
					<div class="flex items-center justify-between gap-3"><dt class="text-ink-soft">Semester</dt><dd class="font-semibold">{semesterLabel(note.semester)}</dd></div>
					<div class="flex items-center justify-between gap-3"><dt class="text-ink-soft">Updated</dt><dd class="font-semibold">{formatDate(note.updated_at)}</dd></div>
				</dl>
				{#if note.verified_by && note.verified_at}
					<div class="mt-3 rounded-lg border border-[#1C7A50]/40 bg-[#EFFBF3] px-2 py-1.5 text-[0.68rem] font-semibold text-[#155c3c]">
						<p class="flex items-center gap-1.5"><CheckCircle2 size={13} /> Verified {formatDate(note.verified_at)}</p>
						{#if note.verifier}
							<p class="mt-0.5 flex items-center gap-1.5 pl-[19px] text-[#2b6b4f]">
								by {note.verifier.full_name}{note.verifier.role !== 'student' ? ` · ${note.verifier.role}` : ''}
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="card p-4">
				<div class="flex items-center justify-between">
					<p class="flex items-center gap-1.5 kicker !text-[0.6rem]"><Quote size={12} /> Cite this note</p>
					<span class="font-mono text-[0.6rem] text-ink-faint">Updated {formatDate(note.updated_at)}</span>
				</div>
				<div class="mt-2 flex gap-1 rounded-lg border-2 border-ink bg-paper p-0.5">
					{#each [{ id: 'apa', label: 'APA' }, { id: 'mla', label: 'MLA' }, { id: 'chicago', label: 'Chicago' }] as style (style.id)}
						<button
							type="button"
							class="tab !min-h-6 flex-1 !px-1.5 !text-[0.64rem]"
							class:is-active={citationStyle === style.id}
							onclick={() => (citationStyle = style.id as CitationStyle)}
						>
							{style.label}
						</button>
					{/each}
				</div>
				<p class="mt-2 rounded-lg border border-ink/20 bg-paper-deep/60 p-2.5 font-mono text-[0.66rem] leading-relaxed text-ink-soft">
					{citation}
				</p>
				<button type="button" class="btn btn-secondary btn-sm mt-2 w-full" onclick={copyCitation}>
					{#if copiedCitation}
						<CheckCircle2 size={14} /> Copied
					{:else}
						<Copy size={14} /> Copy citation
					{/if}
				</button>
				<p class="mt-2 text-[0.64rem] leading-relaxed text-ink-faint">
					Community-submitted coursework. Cite the author, not the university.
				</p>
			</div>

			{#if sourceUrl}
				<div class="card p-4">
					<p class="kicker !text-[0.6rem]">Referenced source</p>
					<a
						href={sourceUrl}
						target="_blank"
						rel="noopener noreferrer nofollow"
						class="mt-2 flex items-start gap-2 text-[0.75rem] font-semibold text-violet hover:underline"
					>
						<ExternalLink size={14} class="mt-0.5 shrink-0" />
						<span class="break-all">{sourceUrl}</span>
					</a>
					<p class="mt-2 text-[0.64rem] leading-relaxed text-ink-faint">
						External link supplied by the author. Pinboard does not verify or endorse its contents.
					</p>
				</div>
			{/if}

			<div class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.78rem] font-bold"><AlertTriangle size={15} /> LSPU student note</p>
				<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
					Written by an LSPU student for Laguna State Polytechnic University classmates. Check formulas, dates, and
					definitions against your instructor's discussion before you rely on them.
				</p>
			</div>

			{#if data.isAuthor}
				<div class="card p-4">
					<p class="kicker !text-[0.6rem]">Author actions</p>
					<p class="mt-1 text-[0.74rem] leading-relaxed text-ink-soft">
						{#if note.status === 'rejected'}Revise the note based on the feedback above, then publish it again.{:else if note.verified_by}Your note is published and was checked by a moderator. Propose an update without removing the verified version.{:else}Your note is published and visible to the community. You can edit or delete it at any time.{/if}
					</p>
					{#if data.canEdit}
						<a href="/notes/{note.id}/edit" class="btn btn-primary btn-sm mt-2 w-full"><PenLine size={14} /> {note.status === 'rejected' ? 'Fix and republish' : 'Edit note'}</a>
					{:else}
						<a href="/notes/new?from={note.id}" class="btn btn-secondary btn-sm mt-2 w-full"><PenLine size={14} /> Submit a revision</a>
					{/if}
					{#if data.canEdit}
						<form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm('Delete this note permanently?')) { cancel(); return; } return async ({ update }) => { await update(); }; }}>
							<button type="submit" class="btn btn-ghost btn-sm mt-1 w-full !text-[#B42318]"><Trash2 size={14} /> Delete note</button>
						</form>
					{/if}
				</div>
			{/if}

			<details class="card overflow-hidden">
				<summary class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-[0.78rem] font-bold hover:bg-paper-deep [&::-webkit-details-marker]:hidden">
					<Flag size={15} /> Report this note
				</summary>
				<div class="border-t-2 border-ink p-4">
					{#if data.alreadyReported}
						<p class="text-[0.78rem] leading-relaxed text-ink-soft">You already have an open report for this note. A moderator will review it.</p>
					{:else if form && 'reportSuccess' in form && form.reportSuccess}
						<p class="flex items-center gap-1.5 text-[0.8rem] font-semibold text-[#155c3c]"><CheckCircle2 size={15} /> Report sent. Thank you.</p>
					{:else}
						{#if form && 'reportError' in form && form.reportError}
							<p class="mb-2 text-[0.75rem] font-semibold text-[#B42318]">{form.reportError}</p>
						{/if}
						<form
							method="POST"
							action="?/report"
							class="flex flex-col gap-2"
							use:enhance={() => {
								reporting = true;
								return async ({ update }) => {
									await update();
									reporting = false;
								};
							}}
						>
							<label class="flex flex-col">
								<span class="label">Reason</span>
								<select class="select" name="reason" required>
									<option value="">Choose a reason</option>
									<option value="incorrect">Incorrect or misleading content</option>
									<option value="not-academic">Not academic / spam</option>
									<option value="copyright">Copyright concern</option>
									<option value="harassment">Unsafe or disrespectful content</option>
									<option value="other">Something else</option>
								</select>
							</label>
							<textarea class="textarea" name="details" rows="3" placeholder="What should a moderator check?"></textarea>
							<button type="submit" class="btn btn-secondary btn-sm" disabled={reporting}>{reporting ? 'Sending…' : 'Send report'}</button>
						</form>
					{/if}
				</div>
			</details>

			<a href="/notes" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to all notes</a>
		</aside>
	</div>
</div>
