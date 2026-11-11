<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		kicker,
		title,
		description,
		children
	}: { kicker?: string; title: string; description?: string; children?: Snippet } = $props();
</script>

<header class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
	<div class="flex max-w-3xl flex-col gap-2">
		{#if kicker}
			<p class="kicker">{kicker}</p>
		{/if}
		<h1 class="display text-[2rem] leading-[1.05] sm:text-[2.6rem]">{title}</h1>
		{#if description}
			<p class="text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="flex flex-wrap items-center gap-2">
			{@render children()}
		</div>
	{/if}
</header>
