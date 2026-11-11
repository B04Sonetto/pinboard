<script lang="ts">
	import { Bookmark } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { toast } from '$lib/stores/toast.svelte';

	let {
		noteId,
		saved: initialSaved = false,
		size = 18,
		label = true
	}: { noteId: string; saved?: boolean; size?: number; label?: boolean } = $props();

	let saved = $state(untrack(() => initialSaved));
	let busy = $state(false);

	// The note page can navigate between notes without remounting this button.
	$effect(() => {
		saved = initialSaved;
	});

	async function toggle(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (busy) return;
		busy = true;
		const next = !saved;
		saved = next;
		try {
			const response = await fetch('/api/bookmarks', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ noteId, saved: next })
			});
			if (response.status === 401) {
				await goto('/login?redirect=' + encodeURIComponent(location.pathname));
				return;
			}
			if (!response.ok) throw new Error('Could not update bookmark');
			const data = (await response.json()) as { saved: boolean };
			saved = data.saved;
			toast.success(data.saved ? 'Saved to My Collection' : 'Removed from My Collection');
		} catch {
			saved = !next;
			toast.error('Could not update your saved notes. Try again.');
		} finally {
			busy = false;
		}
	}
</script>

<button
	type="button"
	class="btn btn-secondary btn-sm"
	style={saved ? 'background:#FFD34D' : ''}
	aria-pressed={saved}
	aria-label={saved ? 'Remove from My Collection' : 'Save to My Collection'}
	title={saved ? 'Remove from My Collection' : 'Save to My Collection'}
	onclick={toggle}
	disabled={busy}
>
	<Bookmark size={size} fill={saved ? 'currentColor' : 'none'} strokeWidth={2.2} />
	{#if label}<span class="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>{/if}
</button>
