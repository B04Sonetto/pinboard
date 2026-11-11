<script lang="ts">
	import { ArrowUpRight, Clock, Download, Paperclip } from '@lucide/svelte';
	import Badge from './Badge.svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import Avatar from './Avatar.svelte';
	import type { Note } from '$lib/types';
	import { formatDate, relativeTime, semesterLabel, yearLabel } from '$lib/utils';

	let {
		note,
		saved = false,
		bookmark = true,
		query = ''
	}: { note: Note; saved?: boolean; bookmark?: boolean; query?: string } = $props();

	const meta = $derived(
		[note.subject?.name, yearLabel(note.year_level), semesterLabel(note.semester)].filter(Boolean).join(' · ')
	);
	const accent = $derived(note.department?.color || '#FFD34D');
	const searchTerms = $derived(query.trim().split(/\s+/).filter((term) => term.length > 1));

	function highlightParts(text: string | null | undefined): { text: string; matched: boolean }[] {
		if (!text || searchTerms.length === 0) return [{ text: text ?? '', matched: false }];
		const escaped = searchTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		const pattern = new RegExp(`(${escaped.join('|')})`, 'ig');
		return text.split(pattern).filter(Boolean).map((part) => ({
			text: part,
			matched: searchTerms.some((term) => part.toLowerCase() === term.toLowerCase())
		}));
	}

	const titleParts = $derived(highlightParts(note.title));
	const summaryParts = $derived(highlightParts(note.summary || 'Open this note to read the full material.'));
</script>

<article
	class="card card-hover group relative flex h-full flex-col overflow-hidden"
	style="border-left-width:6px;border-left-color:{accent}"
>
	<a href="/notes/{note.id}" class="absolute inset-0 z-0" aria-label="Read {note.title}"></a>

	<div class="pointer-events-none relative z-10 flex flex-1 flex-col gap-3 p-4 sm:p-5">
		<div class="flex flex-wrap items-start justify-between gap-2">
			<div class="flex flex-wrap items-center gap-1.5">
				<span class="kicker !text-[0.6rem]">{note.department?.short_name ?? 'Community'} · {note.subject?.code ?? 'Subject'}</span>
				{#if note.visibility === 'department'}
					<span class="chip !min-h-5 !px-1.5 !text-[0.58rem] font-bold bg-amber-100/90 text-amber-950 border border-ink/40" title="Department only ({note.department?.short_name})">
						🔒 {note.department?.short_name ?? 'Dept'}
					</span>
				{:else}
					<span class="chip !min-h-5 !px-1.5 !text-[0.58rem] font-bold bg-emerald-100/80 text-emerald-950 border border-ink/40" title="Visible university-wide">
						🌐 All
					</span>
				{/if}
			</div>
			<Badge status={note.status} origin={note.origin} />
		</div>

		<div class="flex flex-col gap-1.5">
			<h3 class="font-display text-[1.18rem] font-extrabold leading-[1.15] tracking-[-0.02em] transition group-hover:underline">
				{#each titleParts as part, index (index)}{#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}
			</h3>
			<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.68rem] font-semibold text-ink-soft">
				<span>{meta}</span>
				{#if note.topic}<span class="text-ink-faint">/</span><span class="text-violet">{note.topic.name}</span>{/if}
			</div>
		</div>

		<p class="line-clamp-3 text-[0.82rem] leading-relaxed text-ink-soft">
			{#each summaryParts as part, index (index)}{#if part.matched}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}
		</p>

		{#if note.keywords?.length}
			<div class="mt-auto flex flex-wrap gap-1.5 pt-1">
				{#each note.keywords.slice(0, 3) as keyword (keyword)}
					<span class="chip chip-soft !min-h-6 !text-[0.66rem]">#{keyword}</span>
				{/each}
				{#if note.keywords.length > 3}
					<span class="self-center text-[0.65rem] font-bold text-ink-faint">+{note.keywords.length - 3}</span>
				{/if}
			</div>
		{/if}

		<div class="mt-2 flex items-center gap-2 border-t border-dashed border-ink/15 pt-3">
			<Avatar name={note.author?.full_name} color={note.author?.avatar_color} size={28} />
			<div class="min-w-0 flex-1">
				<p class="truncate text-[0.74rem] font-bold">{note.author?.full_name ?? 'Student contributor'}</p>
				<p class="flex items-center gap-1 text-[0.64rem] text-ink-faint">
					<Clock size={10} /> {relativeTime(note.created_at)}
				</p>
			</div>
			{#if note.file_path}
				<span class="flex items-center gap-0.5 text-[0.64rem] font-bold text-ink-soft" title="Has an attached file">
					<Paperclip size={12} />
				</span>
			{/if}
			<span class="flex items-center gap-0.5 text-[0.64rem] font-bold text-ink-soft" title="{note.downloads} downloads">
				<Download size={12} /> {note.downloads}
			</span>
			{#if bookmark}
				<span class="pointer-events-auto">
					<BookmarkButton noteId={note.id} {saved} size={15} label={false} />
				</span>
			{/if}
		</div>
	</div>

	<span
		class="pointer-events-none absolute right-3 top-0 h-2.5 w-10 -translate-y-1/2 rotate-[-4deg] bg-[#FFF1B5]/80"
		aria-hidden="true"
	></span>
	<ArrowUpRight
		size={16}
		class="pointer-events-none absolute bottom-3 right-3 z-10 hidden text-ink-faint opacity-0 transition group-hover:opacity-100 sm:block"
	/>
</article>
