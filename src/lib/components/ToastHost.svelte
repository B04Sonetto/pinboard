<script lang="ts">
	import { fly } from 'svelte/transition';
	import { CheckCircle2, Info, X, XCircle } from '@lucide/svelte';
	import { toast } from '$lib/stores/toast.svelte';

	const tones = {
		success: { icon: CheckCircle2, class: 'border-[#1C7A50] bg-[#EFFBF3]', iconClass: 'text-[#1C7A50]' },
		error: { icon: XCircle, class: 'border-[#B42318] bg-[#FFF1EF]', iconClass: 'text-[#B42318]' },
		info: { icon: Info, class: 'border-[#211D31] bg-[#FFFDF7]', iconClass: 'text-[#5130B8]' }
	};
</script>

<div class="pointer-events-none fixed inset-x-4 bottom-24 z-[80] flex flex-col items-center gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:items-end">
	{#each toast.items as item (item.id)}
		{@const tone = tones[item.tone]}
		<div
			class="animate-pop pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-[3px_3px_0_#211D31] {tone.class}"
			role="status"
			transition:fly={{ y: 12, duration: 180 }}
		>
			<tone.icon size={18} class="mt-0.5 shrink-0 {tone.iconClass}" />
			<p class="flex-1 text-sm font-semibold leading-snug">{item.message}</p>
			<button
				type="button"
				class="-m-1 rounded p-1 text-ink-soft hover:bg-black/5 hover:text-ink"
				aria-label="Dismiss notification"
				onclick={() => toast.dismiss(item.id)}
			>
				<X size={15} />
			</button>
		</div>
	{/each}
</div>
