<script lang="ts">
	import '../app.css';
	import ToastHost from '$lib/components/ToastHost.svelte';
	import { navigating } from '$app/state';

	let { children } = $props();
</script>

{#if navigating.to}
	<div class="fixed inset-x-0 top-0 z-[100] h-[3px] overflow-hidden bg-marigold-soft" aria-hidden="true">
		<div class="h-full w-1/2 animate-[progress_900ms_ease-in-out_infinite] bg-ink"></div>
	</div>
{/if}

{@render children()}
<ToastHost />

<style>
	@keyframes progress {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}
</style>
