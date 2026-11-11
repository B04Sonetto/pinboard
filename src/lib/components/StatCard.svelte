<script lang="ts">
	import type { Component } from 'svelte';

	let {
		label,
		value,
		icon: Icon,
		hint,
		tint = '#FFE680'
	}: { label: string; value: string | number; icon: Component; hint?: string; tint?: string } = $props();
</script>

<div class="card flex items-center gap-3 p-4">
	<span
		class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-ink"
		style="background:{tint}"
	>
		<Icon size={19} />
	</span>
	<div class="min-w-0">
		<div class="stat-value">{value}</div>
		<div class="mt-0.5 truncate text-[0.72rem] font-bold uppercase tracking-[0.08em] text-ink-soft">{label}</div>
		{#if hint}<div class="mt-0.5 truncate text-[0.72rem] text-ink-faint">{hint}</div>{/if}
	</div>
</div>
