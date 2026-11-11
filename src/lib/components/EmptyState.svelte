<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { FileText } from '@lucide/svelte';

	let {
		title,
		description,
		icon: Icon = FileText,
		children
	}: {
		title: string;
		description?: string;
		icon?: Component;
		children?: Snippet;
	} = $props();
</script>

<div class="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-paper-card/70 px-6 py-14 text-center">
	<span class="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-marigold-soft shadow-[3px_3px_0_#211D31]">
		<Icon size={24} />
	</span>
	<h3 class="font-display text-xl font-extrabold">{title}</h3>
	{#if description}
		<p class="max-w-md text-sm leading-relaxed text-ink-soft">{description}</p>
	{/if}
	{#if children}
		<div class="mt-2 flex flex-wrap justify-center gap-2">{@render children()}</div>
	{/if}
</div>
