<script lang="ts">
	import { Bookmark } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';

	let {
		topicId,
		saved: initialSaved = false
	}: { topicId: string; saved?: boolean } = $props();

	let saved = $state(untrack(() => initialSaved));
	let busy = $state(false);

	async function toggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (busy) return;
		busy = true;
		const next = !saved;
		saved = next;
		try {
			const response = await fetch('/api/topic-bookmarks', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ topicId, saved: next })
			});
			if (response.status === 401) {
				await goto('/login?redirect=' + encodeURIComponent(location.pathname));
				return;
			}
			if (!response.ok) throw new Error('Could not update bookmark');
			const data = (await response.json()) as { saved: boolean };
			saved = data.saved;
			toast.success(data.saved ? 'Topic bookmarked' : 'Topic removed from bookmarks');
		} catch {
			saved = !next;
			toast.error('Could not update this topic bookmark.');
		} finally {
			busy = false;
		}
	}
</script>

<button
	type="button"
	class="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink bg-white text-ink transition hover:bg-marigold-soft"
	style={saved ? 'background:#FFD34D' : ''}
	aria-pressed={saved}
	aria-label={saved ? 'Remove topic bookmark' : 'Bookmark this topic'}
	title={saved ? 'Remove topic bookmark' : 'Bookmark this topic'}
	onclick={toggle}
	disabled={busy}
>
	<Bookmark size={15} fill={saved ? 'currentColor' : 'none'} strokeWidth={2.2} />
</button>
