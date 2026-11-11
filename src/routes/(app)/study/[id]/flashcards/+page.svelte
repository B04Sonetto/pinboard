<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import Badge from '$lib/components/Badge.svelte';
	import {
		ArrowLeft,
		Check,
		ChevronLeft,
		ChevronRight,
		Clock,
		Layers,
		RotateCcw,
		Shuffle,
		Sparkles
	} from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	const generation = $derived(data.generation);
	const original = $derived(data.cards);

	let order = $state<number[]>(untrack(() => original.map((_, index) => index)));
	let position = $state(0);
	let flipped = $state(false);
	let onlyDue = $state(false);
	let cardReviews = $state<Record<string, number>>({});

	$effect(() => {
		try {
			const saved = localStorage.getItem(`pinboard_fc_reviews_${generation.id}`);
			if (saved) {
				cardReviews = JSON.parse(saved);
			}
		} catch {}
	});

	function saveReview(cardId: string, daysAhead: number) {
		const nextDue = Date.now() + daysAhead * 24 * 60 * 60 * 1000;
		cardReviews = { ...cardReviews, [cardId]: nextDue };
		try {
			localStorage.setItem(`pinboard_fc_reviews_${generation.id}`, JSON.stringify(cardReviews));
		} catch {}
		go(1);
	}

	function isDue(cardId: string): boolean {
		const dueTime = cardReviews[cardId];
		if (!dueTime) return true; // never reviewed -> due
		return Date.now() >= dueTime;
	}

	const dueCardsCount = $derived(original.filter((c) => isDue(c.id)).length);

	const activeIndices = $derived(
		onlyDue
			? original.map((c, i) => (isDue(c.id) ? i : -1)).filter((i) => i !== -1)
			: original.map((_, i) => i)
	);

	const card = $derived(original[order[position] ?? 0]);
	const total = $derived(order.length);
	const progress = $derived(total ? Math.round(((position + 1) / total) * 100) : 0);

	function toggleDueOnly() {
		onlyDue = !onlyDue;
		if (onlyDue) {
			order = original.map((c, i) => (isDue(c.id) ? i : -1)).filter((i) => i !== -1);
		} else {
			order = original.map((_, index) => index);
		}
		position = 0;
		flipped = false;
	}

	function go(delta: number) {
		position = (position + delta + total) % total;
		flipped = false;
	}

	function flip() {
		flipped = !flipped;
	}

	function shuffle() {
		const next = [...order];
		for (let i = next.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[next[i], next[j]] = [next[j], next[i]];
		}
		order = next;
		position = 0;
		flipped = false;
	}

	function reset() {
		order = original.map((_, index) => index);
		position = 0;
		flipped = false;
	}

	function onKey(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
		if (event.key === 'ArrowRight') go(1);
		else if (event.key === 'ArrowLeft') go(-1);
		else if (event.key === ' ' || event.key === 'Enter') {
			event.preventDefault();
			flip();
		}
	}
</script>

<svelte:window onkeydown={onKey} />

<svelte:head>
	<title>Flashcards · {generation.title} · Pinboard</title>
	<meta name="description" content="Flashcards generated from community notes on Pinboard." />
</svelte:head>

<div class="flex flex-col gap-5">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft no-print" aria-label="Breadcrumb">
		<a href="/study" class="hover:text-ink hover:underline">AI Study Assistant</a>
		<span class="text-ink-faint">/</span>
		<a href="/study/{generation.id}" class="hover:text-ink hover:underline">Material</a>
		<span class="text-ink-faint">/</span>
		<span class="truncate text-ink">Flashcards</span>
	</nav>

	<header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<span class="badge badge-ai"><span aria-hidden="true">✦</span> AI Generated</span>
				<span class="badge badge-neutral"><Layers size={12} /> Flashcard set</span>
			</div>
			<h1 class="display mt-2 max-w-3xl text-[1.8rem] leading-[1.08] sm:text-[2.3rem]">{generation.title}</h1>
			<p class="mt-2 text-[0.76rem] text-ink-soft">
				{total} cards · tap the card or press <kbd class="rounded border border-ink/30 bg-paper px-1 font-mono text-[0.62rem]">Space</kbd> to flip · use ← → to move
			</p>
		</div>
		<div class="flex flex-wrap gap-2 no-print">
			<button
				type="button"
				class="btn btn-sm"
				class:btn-primary={onlyDue}
				class:btn-secondary={!onlyDue}
				onclick={toggleDueOnly}
			>
				<Clock size={14} /> Review due ({dueCardsCount})
			</button>
			<button type="button" class="btn btn-secondary btn-sm" onclick={shuffle}><Shuffle size={14} /> Shuffle</button>
			<button type="button" class="btn btn-secondary btn-sm" onclick={reset}><RotateCcw size={14} /> Reset</button>
		</div>
	</header>

	<div class="mx-auto w-full max-w-3xl">
		<div class="mb-2 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-soft">
			<span>Card {position + 1} of {total}</span>
			<span>{progress}%</span>
		</div>
		<div class="h-2 overflow-hidden rounded-full border-2 border-ink bg-paper">
			<div class="h-full bg-marigold transition-[width] duration-300" style="width: {progress}%"></div>
		</div>

		<div class="mt-4 [perspective:1600px]">
			<button
				type="button"
				class="relative block h-[22rem] w-full cursor-pointer text-left focus-visible:outline-none sm:h-[24rem]"
				onclick={flip}
				aria-label={flipped ? 'Show the prompt side' : 'Show the answer side'}
			>
				<div
					class="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none"
					style="transform: rotateY({flipped ? 180 : 0}deg)"
				>
					<div
						class="note-sheet absolute inset-0 flex flex-col justify-between p-6 [backface-visibility:hidden] sm:p-8"
					>
						<span class="absolute right-5 top-0 h-3 w-16 -translate-y-1/2 rotate-[-4deg] bg-[#FFF1B5]/90" aria-hidden="true"></span>
						<span class="kicker !text-[0.6rem]">Prompt</span>
						<p class="font-display text-2xl font-extrabold leading-tight sm:text-3xl">{card.front}</p>
						<span class="flex items-center gap-1.5 text-[0.7rem] font-semibold text-ink-faint">
							<Sparkles size={13} /> Tap to reveal the source sentence
						</span>
					</div>

					<div
						class="absolute inset-0 flex flex-col justify-between rounded-[--radius] border-2 border-ink bg-[#F4F0FF] p-6 shadow-[6px_6px_0_#211D31] [backface-visibility:hidden] [transform:rotateY(180deg)] sm:p-8"
					>
						<span class="kicker !text-[0.6rem] text-violet">Answer</span>
						<p class="text-[1.02rem] leading-relaxed text-ink sm:text-[1.1rem]">{card.back}</p>
						<div class="flex flex-col gap-2 border-t-2 border-dashed border-ink/20 pt-3">
							{#if card.sourceTitle}
								<a
									href={card.sourceNoteId ? `/notes/${card.sourceNoteId}` : '/notes'}
									class="link inline-flex w-fit items-center gap-1 text-[0.72rem]"
									onclick={(event) => event.stopPropagation()}
								>
									 From: {card.sourceTitle} →
								</a>
							{/if}
							<p class="text-[0.66rem] leading-relaxed text-ink-faint">
								Generated from community material. Check the definition against your class notes.
							</p>
						</div>
					</div>
				</div>
			</button>
		</div>

		<div class="mt-4 flex flex-col gap-2 no-print">
			{#if flipped && card}
				<div class="flex items-center justify-center gap-2 rounded-xl border-2 border-ink bg-paper p-2">
					<span class="text-xs font-bold mr-1 text-ink-soft">Rate recall:</span>
					<button
						type="button"
						class="btn btn-secondary btn-sm !text-xs !bg-coral-soft hover:!bg-coral"
						onclick={(e) => { e.stopPropagation(); saveReview(card.id, 0); }}
					>
						Again (today)
					</button>
					<button
						type="button"
						class="btn btn-secondary btn-sm !text-xs !bg-marigold-soft hover:!bg-marigold"
						onclick={(e) => { e.stopPropagation(); saveReview(card.id, 1); }}
					>
						Hard (1 day)
					</button>
					<button
						type="button"
						class="btn btn-secondary btn-sm !text-xs !bg-[#EFFBF3] hover:!bg-leaf"
						onclick={(e) => { e.stopPropagation(); saveReview(card.id, 3); }}
					>
						Good (3 days)
					</button>
					<button
						type="button"
						class="btn btn-secondary btn-sm !text-xs !bg-sky-soft hover:!bg-sky"
						onclick={(e) => { e.stopPropagation(); saveReview(card.id, 7); }}
					>
						Easy (7 days)
					</button>
				</div>
			{/if}

			<div class="flex items-center justify-between gap-3">
				<button type="button" class="btn btn-secondary" onclick={() => go(-1)}><ChevronLeft size={16} /> Previous</button>
				<button type="button" class="btn btn-secondary btn-sm" onclick={flip}>{flipped ? 'Show prompt' : 'Show answer'}</button>
				<button type="button" class="btn btn-primary" onclick={() => go(1)}>Next <ChevronRight size={16} /></button>
			</div>
		</div>
	</div>

	<div class="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 border-t-2 border-dashed border-ink/20 pt-4">
		<a href="/study/{generation.id}/quiz" class="btn btn-secondary btn-sm"><Sparkles size={14} /> Take the quiz</a>
		<a href="/study/{generation.id}" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to material</a>
	</div>

	{#if generation.subject}
		<div class="mx-auto w-full max-w-3xl">
			<div class="flex flex-wrap items-center gap-2 text-[0.72rem] text-ink-soft">
				<span>Related:</span>
				<a href="/courses/{generation.subject.id}" class="chip !min-h-6 !text-[0.66rem] hover:bg-marigold">{generation.subject.code}</a>
				{#if generation.topic}<span class="chip chip-soft !min-h-6 !text-[0.66rem]">{generation.topic.name}</span>{/if}
				<Badge status="verified" compact />
			</div>
		</div>
	{/if}
</div>
