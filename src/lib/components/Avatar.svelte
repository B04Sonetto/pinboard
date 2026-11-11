<script lang="ts">
	import { initials } from '$lib/utils';

	let {
		name,
		color = '#FFD34D',
		size = 36,
		role
	}: { name: string | null | undefined; color?: string | null; size?: number; role?: string } = $props();

	const fill = $derived(color || '#FFD84D');
</script>

<span
	class="avatar"
	style="width:{size}px;height:{size}px;background:{fill};font-size:{Math.max(10, size * 0.32)}px"
	title={name ?? 'Student'}
>
	{initials(name)}
	{#if role === 'moderator' || role === 'admin'}
		<span class="sr-only">({role})</span>
	{/if}
</span>
