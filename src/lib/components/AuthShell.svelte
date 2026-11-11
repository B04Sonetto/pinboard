<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from '$lib/components/Logo.svelte';
	import { BadgeCheck, BookOpenCheck, Layers3, Sparkles } from '@lucide/svelte';

	let {
		mode,
		children,
		notice
	}: { mode: 'login' | 'register' | 'recovery'; children: Snippet; notice?: Snippet } = $props();

	const features = [
		{ icon: BookOpenCheck, text: 'Notes, lessons and reviewers from every department' },
		{ icon: BadgeCheck, text: 'Community Verified labels, reviewed by student moderators' },
		{ icon: Sparkles, text: 'AI study material built only from the notes you choose' },
		{ icon: Layers3, text: 'Organized by program, year level, semester and subject' }
	];
</script>

<div class="min-h-dvh lg:grid lg:grid-cols-[0.92fr_1.08fr]">
	<aside class="relative hidden overflow-hidden border-r-2 border-ink bg-[#F3EDDD] p-10 lg:flex lg:flex-col xl:p-14">
		<div
			class="pointer-events-none absolute inset-0 opacity-[0.55]"
			style="background-image:radial-gradient(rgba(33,29,49,.12) 1px, transparent 1px);background-size:24px 24px"
			aria-hidden="true"
		></div>

		<div class="relative z-10">
			<Logo size={32} href="/login" />
		</div>

		<div class="relative z-10 mt-14 max-w-xl">
			<p class="kicker">A community knowledge board</p>
			<h1 class="display mt-3 text-[2.7rem] leading-[0.98] xl:text-[3.3rem]">
				Every lesson you survive becomes a note someone else needs.
			</h1>
			<p class="mt-5 max-w-lg text-[0.98rem] leading-relaxed text-ink-soft">
				Pinboard is the study board for Laguna State Polytechnic University. LSPU students keep notes from class,
				find material from earlier batches, and turn them into something they can actually study.
			</p>
		</div>

		<ul class="relative z-10 mt-9 flex max-w-lg flex-col gap-3">
			{#each features as feature (feature.text)}
				<li class="flex items-start gap-2.5 text-[0.85rem] font-medium text-[#3b3652]">
					<span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-ink bg-paper-card">
						<feature.icon size={13} strokeWidth={2.3} />
					</span>
					{feature.text}
				</li>
			{/each}
		</ul>

		<div class="relative z-10 mt-auto grid max-w-lg grid-cols-2 gap-4 pt-10">
			<div class="relative rounded-sm border-2 border-ink bg-[#FFE680] p-3 pt-5 shadow-[3px_5px_0_rgba(33,29,49,.35)] rotate-[-1.2deg]">
				<span class="absolute left-1/2 top-1.5 h-2.5 w-9 -translate-x-1/2 rotate-[-4deg] bg-[#FFF1B5]/90"></span>
				<p class="font-mono text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink-soft">DBMS101 · Year 2</p>
				<p class="mt-1 font-hand text-[1.45rem] font-bold leading-none">Normalization: 1NF to 3NF</p>
				<p class="mt-2 text-[0.68rem] leading-snug text-[#443F5C]">The whole key and nothing but the key.</p>
			</div>
			<div class="relative rounded-sm border-2 border-ink bg-[#BFE0FF] p-3 pt-5 shadow-[3px_5px_0_rgba(33,29,49,.35)] rotate-[1.4deg]">
				<span class="absolute left-1/2 top-1.5 h-2.5 w-9 -translate-x-1/2 rotate-[3deg] bg-[#FFF1B5]/90"></span>
				<p class="font-mono text-[0.55rem] font-bold uppercase tracking-[0.1em] text-ink-soft">PHYS101 · Year 1</p>
				<p class="mt-1 font-hand text-[1.45rem] font-bold leading-none">Kinematics formula sheet</p>
				<p class="mt-2 text-[0.68rem] leading-snug text-[#443F5C]">Pick the equation with one unknown.</p>
			</div>
		</div>

		<p class="relative z-10 mt-8 max-w-md text-[0.65rem] leading-relaxed text-ink-soft">
			Built for Laguna State Polytechnic University students. Use your LSPU student email,
			for example 0324-0574@lspu.edu.ph. Pinboard is a student community platform, not an official university service.
		</p>
	</aside>

	<main class="flex min-h-dvh flex-col bg-paper px-4 py-6 sm:px-8 lg:px-12">
		<div class="flex items-center justify-between lg:justify-end">
			<div class="lg:hidden"><Logo size={28} href="/login" /></div>
			<p class="text-[0.75rem] text-ink-soft">
				{#if mode === 'login'}
					New here?
					<a href="/register" class="link">Create an account</a>
				{:else if mode === 'register'}
					Already a member?
					<a href="/login" class="link">Sign in</a>
				{:else}
					<a href="/login" class="link">Back to sign in</a>
				{/if}
			</p>
		</div>

		<div class="flex flex-1 items-center justify-center py-8">
			<div class="w-full max-w-[420px]">
				{#if mode !== 'recovery'}
					<div class="mb-5 flex items-center gap-1 rounded-lg border-2 border-ink bg-paper-card p-1">
						<a href="/login" class="tab flex-1 justify-center" class:is-active={mode === 'login'}>Sign in</a>
						<a href="/register" class="tab flex-1 justify-center" class:is-active={mode === 'register'}>Create account</a>
					</div>
				{/if}

				{#if notice}
					{@render notice()}
				{/if}

				<p class="mb-3 text-center font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-soft">
					Laguna State Polytechnic University
				</p>

				<div class="card p-5 shadow-[5px_5px_0_#211D31] sm:p-6">
					{@render children()}
				</div>

				<p class="mt-4 text-center text-[0.68rem] leading-relaxed text-ink-soft">
					For LSPU students. Keep what you share academic, respectful, and honest. Community notes are not official university material.
				</p>
			</div>
		</div>
	</main>
</div>
