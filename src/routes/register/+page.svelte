<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import { AlertCircle, ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound } from '@lucide/svelte';

	let { data, form }: { data: Record<string, never>; form: ActionData } = $props();
	let submitting = $state(false);
	const success = $derived(form && 'success' in form && form.success === true);
</script>

<svelte:head><title>Create account · Pinboard</title></svelte:head>

<AuthShell mode="register">
	{#if success}
		<div class="flex flex-col items-center py-6 text-center">
			<span class="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-ink bg-[#EFFBF3] shadow-[3px_3px_0_#211D31]">
				<CheckCircle2 size={26} class="text-[#1C7A50]" />
			</span>
			<h2 class="display mt-4 text-2xl">Check your inbox</h2>
			<p class="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
				We sent a confirmation link to <strong class="text-ink">{form && 'email' in form ? form.email : 'your email'}</strong>.
				Open it to activate your account, then sign in.
			</p>
			<div class="mt-5 flex flex-wrap justify-center gap-2">
				<a href="/login" class="btn btn-primary">Go to sign in</a>
				<a href="/register" class="btn btn-secondary">Use another email</a>
			</div>
			<p class="mt-4 text-[0.7rem] leading-relaxed text-ink-faint">
				No email after a few minutes? Check spam, or ask an administrator to confirm the account.
			</p>
		</div>
	{:else}
		<div class="mb-5">
			<p class="kicker">Join Pinboard</p>
			<h2 class="display mt-1.5 text-[1.8rem]">Create your account</h2>
			<p class="mt-1.5 text-[0.82rem] leading-relaxed text-ink-soft">
				Contribute notes, save materials and generate study reviewers.
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
			class="flex flex-col gap-3.5"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="next" value={form && 'next' in form ? form.next : '/dashboard'} />

			<label class="flex flex-col">
				<span class="label">Full name</span>
				<span class="relative">
					<UserRound size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
					<input
						class="input !pl-9"
						type="text"
						name="full_name"
						autocomplete="name"
						required
						placeholder="Mika Reyes"
						value={form && 'fullName' in form ? form.fullName : ''}
					/>
				</span>
			</label>

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
						placeholder="you@university.edu"
						value={form && 'email' in form ? form.email : ''}
					/>
				</span>
			</label>

			<div class="grid gap-3.5 sm:grid-cols-2">
				<label class="flex flex-col">
					<span class="label">Password</span>
					<span class="relative">
						<LockKeyhole size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
						<input
							class="input !pl-9"
							type="password"
							name="password"
							autocomplete="new-password"
							required
							minlength="8"
							placeholder="8+ characters"
						/>
					</span>
				</label>
				<label class="flex flex-col">
					<span class="label">Confirm password</span>
					<span class="relative">
						<LockKeyhole size={16} class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
						<input
							class="input !pl-9"
							type="password"
							name="confirm"
							autocomplete="new-password"
							required
							placeholder="Repeat password"
						/>
					</span>
				</label>
			</div>

			<label class="flex cursor-pointer items-start gap-2.5 rounded-lg border-2 border-ink/20 bg-paper p-2.5">
				<input type="checkbox" name="terms" class="mt-0.5 h-4 w-4 accent-[#211D31]" />
				<span class="text-[0.74rem] leading-relaxed text-ink-soft">
					I will contribute honestly, credit sources, and respect the community guidelines. I understand
					community notes are not official university material.
				</span>
			</label>

			<button type="submit" class="btn btn-primary btn-lg mt-1 w-full" disabled={submitting}>
				{#if submitting}
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink"></span>
					Creating account…
				{:else}
					Create account
					<ArrowRight size={17} />
				{/if}
			</button>
		</form>
	{/if}
</AuthShell>
