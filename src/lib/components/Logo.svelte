<script lang="ts">
	let { size = 30, href = '/dashboard' }: { size?: number; href?: string } = $props();
</script>

<a {href} class="flex min-h-11 items-center gap-3 text-decoration-none" aria-label="Pinboard home">
	<span
		class="relative inline-block shrink-0 border-[2.5px] border-ink bg-marigold"
		style="width:{size}px;height:{size}px;transform:rotate(-5deg)"
	>
		<span
			class="absolute left-1/2 box-border rounded-full border-[2.5px] border-ink bg-[#E5484D]"
			style="top:{-size * 0.26}px;margin-left:{-(size * 0.23)}px;width:{size * 0.46}px;height:{size * 0.46}px"
		></span>
	</span>
	<span class="font-display text-[1.55rem] font-extrabold leading-none tracking-[-0.03em]">Pinboard</span>
</a>
