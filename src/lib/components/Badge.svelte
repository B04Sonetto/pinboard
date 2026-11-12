<script lang="ts">
	import type { NoteOrigin, NoteStatus } from '$lib/types';
	import { statusClass, statusLabel } from '$lib/utils';

	let {
		status = 'submitted',
		origin = 'student',
		compact = false
	}: { status?: NoteStatus; origin?: NoteOrigin; compact?: boolean } = $props();

	const label = $derived(origin === 'ai' ? 'AI Generated' : statusLabel(status));
	const css = $derived(origin === 'ai' ? 'badge-ai' : statusClass(status));
</script>

<span class="badge {css}" title={origin === 'ai' ? 'Created from community reference materials' : label}>
	{#if origin === 'ai'}
		<span aria-hidden="true" class="text-[0.72rem] leading-none">✦</span>
	{:else if status === 'verified'}
		<span aria-hidden="true" class="text-[0.7rem] leading-none">✓</span>
	{:else if status === 'rejected'}
		<span aria-hidden="true" class="text-[0.7rem] leading-none">×</span>
	{/if}
	{#if !compact}{label}{:else}{origin === 'ai' ? 'AI' : status === 'verified' ? 'Published' : 'Submitted'}{/if}
</span>
