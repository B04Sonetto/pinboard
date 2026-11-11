<script lang="ts">
	import { Eye, EyeOff, LockKeyhole } from '@lucide/svelte';

	let {
		name,
		autocomplete = 'current-password' as 'current-password' | 'new-password',
		placeholder = 'Your password',
		minlength,
		required = true,
		inputClass = ''
	}: {
		name: string;
		autocomplete?: 'current-password' | 'new-password';
		placeholder?: string;
		minlength?: number;
		required?: boolean;
		inputClass?: string;
	} = $props();

	let visible = $state(false);
</script>

<span class="relative block">
	<LockKeyhole size={16} class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
	<input
		class="input !pl-9 !pr-11 {inputClass}"
		type={visible ? 'text' : 'password'}
		{name}
		{autocomplete}
		{placeholder}
		{required}
		{minlength}
	/>
	<button
		type="button"
		class="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep hover:text-ink"
		aria-label={visible ? 'Hide password' : 'Show password'}
		aria-pressed={visible}
		onclick={() => (visible = !visible)}
	>
		{#if visible}
			<EyeOff size={16} />
		{:else}
			<Eye size={16} />
		{/if}
	</button>
</span>
