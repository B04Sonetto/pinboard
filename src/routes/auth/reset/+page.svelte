<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import { AlertCircle, ArrowRight, ShieldCheck } from '@lucide/svelte';

	let { data, form }: { data: { email: string }; form: ActionData } = $props();
	let submitting = $state(false);
</script>

<svelte:head><title>Choose a new password · Pinboard</title></svelte:head>

<AuthShell mode="recovery">
	<div class="mb-5">
		<span class="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border-2 border-ink bg-marigold shadow-[3px_3px_0_#211D31]">
			<ShieldCheck size={20} />
		</span>
		<p class="kicker">Secure your account</p>
		<h2 class="display mt-1.5 text-[1.8rem]">Choose a new password</h2>
		<p class="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
			Signing in as <strong class="text-ink">{data.email}</strong>. Pick something you have not used before.
		</p>
	</div>

	{#if form?.error}
		<div
			class="mb-4 flex items-start gap-2 rounded-lg border-2 border-[#B42318] bg-[#FFF1EF] px-3 py-2.5 text-[0.8rem] font-semibold text-[#8f1c12]"
			role="alert"
		>
			<AlertCircle size={16} class="mt-0.5 shrink-0" />
			{form.error}
		</div>
	{/if}

	<form
		method="POST"
		class="flex flex-col gap-4"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<label class="flex flex-col">
			<span class="label">New password</span>
			<PasswordField name="password" autocomplete="new-password" minlength={8} placeholder="8+ characters" />
		</label>

		<label class="flex flex-col">
			<span class="label">Confirm new password</span>
			<PasswordField name="confirm" autocomplete="new-password" placeholder="Repeat password" />
		</label>

		<p class="hint">Use 8 or more characters. A passphrase of a few words is easier to remember and harder to guess.</p>

		<button type="submit" class="btn btn-primary btn-lg w-full" disabled={submitting}>
			{#if submitting}
				<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
				Updating password…
			{:else}
				Update password
				<ArrowRight size={17} />
			{/if}
		</button>
	</form>
</AuthShell>
