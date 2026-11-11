<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { AlertCircle, ArrowRight, LockKeyhole, Mail } from '@lucide/svelte';

	let { data, form }: { data: { next: string; setupRequired: boolean; authError: string | null }; form: ActionData } = $props();
	let submitting = $state(false);
	const message = $derived(form?.error ?? data.authError);
</script>

<svelte:head><title>Sign in · Pinboard</title></svelte:head>

<AuthShell mode="login">
	<div class="mb-5">
		<p class="kicker">Welcome back</p>
		<h2 class="display mt-1.5 text-[1.8rem]">Sign in to your board</h2>
		<p class="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
			Pick up your saved notes, contributions and study material.
		</p>
	</div>

	{#if data.setupRequired}
		<div class="mb-4 rounded-lg border-2 border-ink bg-marigold-soft p-3 text-[0.78rem] leading-relaxed">
			<strong>Heads up:</strong> the database has not been set up yet. You can still sign in, but you will be sent to
			the <a href="/setup" class="link">setup guide</a>.
		</div>
	{/if}

	{#if message}
		<div
			class="mb-4 flex items-start gap-2 rounded-lg border-2 border-[#B42318] bg-[#FFF1EF] px-3 py-2.5 text-[0.8rem] font-semibold text-[#8f1c12]"
			role="alert"
		>
			<AlertCircle size={16} class="mt-0.5 shrink-0" />
			{message}
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
		<input type="hidden" name="next" value={form?.next ?? data.next} />

		<label class="flex flex-col">
			<span class="label">LSPU student email</span>
			<span class="relative">
				<Mail size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
				<input
					class="input !pl-9"
					type="email"
					name="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					placeholder="0000-0000@lspu.edu.ph"
					title="Use the format 0000-0000@lspu.edu.ph"
				/>
			</span>
		</label>

		<label class="flex flex-col">
			<span class="flex items-center justify-between">
				<span class="label">Password</span>
				<a href="/forgot-password" class="mb-1.5 text-[0.7rem] font-semibold text-violet hover:underline">Forgot password?</a>
			</span>
			<span class="relative">
				<LockKeyhole size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
				<input
					class="input !pl-9"
					type="password"
					name="password"
					autocomplete="current-password"
					required
					placeholder="Your password"
				/>
			</span>
		</label>

		<button type="submit" class="btn btn-primary btn-lg mt-1 w-full" disabled={submitting}>
			{#if submitting}
				<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
				Signing in…
			{:else}
				Sign in
				<ArrowRight size={17} />
			{/if}
		</button>
	</form>

	<div class="mt-5 border-t-2 border-dashed border-ink/20 pt-4 text-center text-[0.78rem] text-ink-soft">
		No account yet?
		<a href="/register" class="link">Join the community</a>
	</div>
</AuthShell>
