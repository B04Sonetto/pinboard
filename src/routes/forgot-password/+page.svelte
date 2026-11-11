<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { AlertCircle, ArrowLeft, CheckCircle2, Mail } from '@lucide/svelte';

	let { data, form }: { data: { signedIn: boolean }; form: ActionData } = $props();
	let submitting = $state(false);
	const success = $derived(form !== null && 'success' in form && form.success === true);
</script>

<svelte:head><title>Reset password · Pinboard</title></svelte:head>

<AuthShell mode="recovery">
	{#if success}
		<div class="flex flex-col items-center py-6 text-center">
			<span class="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-[#EFFBF3] shadow-[3px_3px_0_#211D31]">
				<CheckCircle2 size={26} class="text-[#1C7A50]" />
			</span>
			<h2 class="display mt-4 text-2xl">Check your inbox</h2>
			<p class="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
				If an account exists for <strong class="text-ink">{form && 'email' in form ? form.email : 'your email'}</strong>,
				we sent a link to reset your password. The link expires after a short while.
			</p>
			<a href="/login" class="btn btn-secondary mt-5"><ArrowLeft size={16} /> Back to sign in</a>
		</div>
	{:else}
		<div class="mb-5">
			<p class="kicker">Account recovery</p>
			<h2 class="display mt-1.5 text-[1.8rem]">Forgot your password?</h2>
			<p class="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
				Enter the email you signed up with. We will send a secure link to choose a new password.
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
				<span class="label">Email address</span>
				<span class="relative">
					<Mail size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input
						class="input !pl-9"
						type="email"
						name="email"
						autocomplete="email"
						required
						value={form && 'email' in form ? form.email : ''}
						placeholder="you@university.edu"
					/>
				</span>
			</label>

			<button type="submit" class="btn btn-primary btn-lg w-full" disabled={submitting}>
				{#if submitting}
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
					Sending link…
				{:else}
					Send reset link
				{/if}
			</button>
		</form>

		<p class="mt-5 border-t-2 border-dashed border-ink/20 pt-4 text-center text-[0.75rem] leading-relaxed text-ink-soft">
			Remembered it after all? <a href="/login" class="link">Sign in instead</a>
		</p>
	{/if}
</AuthShell>
