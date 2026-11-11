<script lang="ts">
	import { Download, Globe, Lock, Paperclip } from '@lucide/svelte';
	import BookmarkButton from './BookmarkButton.svelte';
	import type { Note } from '$lib/types';
	import {
		DEFAULT_NOTE_COLOR,
		initials,
		noteTilt,
		pinColor,
		semesterLabel,
		statusLabel,
		yearLabel
	} from '$lib/utils';

	let {
		note,
		saved = false,
		bookmark = true,
		query = '',
		flat = true
	}: {
		note: Note;
		saved?: boolean;
		bookmark?: boolean;
		query?: string;
		/**
		 * Flat notes sit straight with no minimum height, which suits lists on a plain page.
		 * Pass `flat={false}` on a cork board to get the tilted, pinned look.
		 */
		flat?: boolean;
	} = $props();

	const color = $derived(note.department?.color || DEFAULT_NOTE_COLOR);
	const departmentName = $derived(note.department?.short_name ?? 'Community');
	const isDepartmentOnly = $derived(note.visibility === 'department');
	const meta = $derived(
		[note.subject?.name, yearLabel(note.year_level), semesterLabel(note.semester)]
			.filter((part) => part && part !== '—')
			.join(' · ')
	);

	const stamp = $derived.by(() => {
		if (note.origin === 'ai') return { css: 'stamp-ai', label: 'AI Generated' };
		return { css: `stamp-${note.status}`, label: statusLabel(note.status) };
	});

	const searchTerms = $derived(query.trim().split(/\s+/).filter((term) => term.length > 1));

	function highlightParts(text: string | null | undefined): { text: string; matched: boolean }[] {
		if (!text || searchTerms.length === 0) return [{ text: text ?? '', matched: false }];
		const escaped = searchTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		const pattern = new RegExp(`(${escaped.join('|')})`, 'ig');
		return text
			.split(pattern)
			.filter(Boolean)
			.map((part) => ({
				text: part,
				matched: searchTerms.some((term) => part.toLowerCase() === term.toLowerCase())
			}));
	}

	const titleParts = $derived(highlightParts(note.title));
	const summaryParts = $derived(highlightParts(note.summary || 'Open this note to read the full material.'));
</script>

<article
	class="sticky group {flat ? 'sticky-flat' : ''}"
	style="--note-color:{color};--note-rot:{noteTilt(note.id)}deg;--pin-color:{pinColor(note.id)}"
>
	<!-- The whole note is one link; the bookmark button sits above it. -->
	<a href="/notes/{note.id}" class="absolute inset-0 z-0" aria-label="Read {note.title}"></a>
	<span class="pin" aria-hidden="true"></span>

	<div class="pointer-events-none relative z-10 flex flex-1 flex-col gap-2.5">
		<div class="flex items-center justify-between gap-2">
			<span class="truncate text-xs font-bold uppercase tracking-[0.06em]" title={note.department?.name}>
				{departmentName}
			</span>
			<span
				class="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-ink-mid"
				title={isDepartmentOnly ? `Only visible to ${departmentName} students` : 'Visible to every department'}
			>
				{#if isDepartmentOnly}
					<Lock size={14} strokeWidth={2} aria-hidden="true" />
					{departmentName} only
				{:else}
					<Globe size={14} strokeWidth={2} aria-hidden="true" />
					Community
				{/if}
			</span>
		</div>

		<h3 class="font-hand text-[1.9rem] leading-[1.02] tracking-normal text-ink">
			{#each titleParts as part, index (index)}{#if part.matched}<mark class="bg-white/70 px-0.5">{part.text}</mark>{:else}{part.text}{/if}{/each}
		</h3>

		{#if meta}
			<p class="text-[0.8rem] font-medium text-ink-mid">{meta}</p>
		{/if}

		<p class="line-clamp-3 text-sm leading-[1.45] text-ink">
			{#each summaryParts as part, index (index)}{#if part.matched}<mark class="bg-white/70 px-0.5">{part.text}</mark>{:else}{part.text}{/if}{/each}
		</p>

		{#if note.keywords?.length}
			<p class="text-[0.8rem] font-medium text-ink-mid">
				{note.keywords
					.slice(0, 3)
					.map((keyword) => `#${keyword}`)
					.join('  ')}
			</p>
		{/if}

		<div class="mt-auto flex flex-col gap-2.5 pt-1">
			<div class="flex items-center justify-between gap-2">
				<span class="stamp {stamp.css}">{stamp.label}</span>
				<span class="flex items-center gap-2.5 text-xs font-bold text-ink-mid">
					{#if note.file_path}
						<span class="inline-flex items-center" title="Has an attached file">
							<Paperclip size={13} aria-hidden="true" />
							<span class="sr-only">Has an attached file</span>
						</span>
					{/if}
					<span class="inline-flex items-center gap-1" title="{note.downloads} downloads">
						<Download size={13} aria-hidden="true" />
						{note.downloads}
						<span class="sr-only">downloads</span>
					</span>
				</span>
			</div>

			<div class="flex items-center gap-2">
				<span
					class="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[4px] bg-ink text-[0.7rem] font-bold text-paper-card"
					aria-hidden="true"
				>
					{initials(note.author?.full_name)}
				</span>
				<span class="min-w-0 flex-1 truncate text-[0.8rem] font-medium">
					{note.author?.full_name ?? 'Student contributor'}
				</span>
				{#if bookmark}
					<span class="pointer-events-auto -my-2 -mr-2.5">
						<BookmarkButton noteId={note.id} {saved} size={20} label={false} variant="plain" />
					</span>
				{/if}
			</div>
		</div>
	</div>
</article>
