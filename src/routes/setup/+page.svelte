<script lang="ts">
	import type { PageData } from './$types';
	import Logo from '$lib/components/Logo.svelte';
	import { Check, Copy, Database, KeyRound, MailCheck, RefreshCw, Terminal } from '@lucide/svelte';
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';

	let { data }: { data: PageData } = $props();

	let copied = $state('');
	const projectRef = new URL(PUBLIC_SUPABASE_URL).hostname.split('.')[0];

	async function copy(text: string, key: string) {
		try {
			await navigator.clipboard.writeText(text);
			copied = key;
			setTimeout(() => (copied = ''), 1800);
		} catch {
			copied = '';
		}
	}

	const schemaSnippet = `-- Run supabase/setup.sql, then supabase/seed.sql
-- in Supabase Dashboard → SQL Editor.`;
</script>

<svelte:head><title>Set up Pinboard</title></svelte:head>

<div class="min-h-dvh bg-paper">
	<header class="border-b-2 border-ink bg-paper-card">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
			<Logo size={30} href="/" />
			<a href="/login" class="btn btn-secondary btn-sm">Go to sign in</a>
		</div>
	</header>

	<main class="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
		<div class="max-w-2xl">
			<p class="kicker">One-time configuration</p>
			<h1 class="display mt-2 text-[2.2rem] leading-[1.02] sm:text-[3rem]">
				{data.ready ? 'Your database is ready' : "Let's connect your database"}
			</h1>
			<p class="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
				{#if data.ready}
					Pinboard can reach its tables. Sign in or create an account to start sharing notes and building
					reviewers.
				{:else}
					Pinboard is running, but it could not find its tables yet. The app needs the schema and some demo
					content before accounts, notes and study tools can work. This takes about two minutes.
				{/if}
			</p>
		</div>

		{#if data.ready}
			<section class="card mt-8 border-leaf-deep p-5 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-leaf">
						<Check size={18} />
					</span>
					<div class="min-w-0">
						<h2 class="font-display text-xl font-extrabold">Database connected</h2>
						<p class="mt-1 text-sm leading-relaxed text-ink-soft">
							The schema was found in project
							<code class="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[0.78rem]">{projectRef}</code>.
							If a table is still empty, run <code class="font-mono text-[0.78rem]">supabase/seed.sql</code>
							to add the demo curriculum.
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<a href="/login" class="btn btn-primary btn-sm">Sign in</a>
							<a href="/register" class="btn btn-secondary btn-sm">Create account</a>
						</div>
					</div>
				</div>
			</section>
		{:else}
			{#if data.detail}
				<div class="mt-6 rounded-xl border-2 border-coral bg-coral/20 p-4 text-sm leading-relaxed">
					<strong>Could not reach the database.</strong>
					{data.detail}
				</div>
			{/if}

			<button type="button" class="btn btn-secondary btn-sm mt-5" onclick={() => location.reload()}>
				<RefreshCw size={15} /> Re-check connection
			</button>

			<div class="mt-8 flex flex-col gap-5">
			<section class="card p-5 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-marigold font-mono text-sm font-bold">1</span>
					<div class="min-w-0">
						<h2 class="font-display text-xl font-extrabold">Open the SQL editor</h2>
						<p class="mt-1 text-sm leading-relaxed text-ink-soft">
							In your Supabase project dashboard, choose <strong>SQL Editor</strong> from the sidebar. The
							project is <code class="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[0.78rem]">{projectRef}</code>.
						</p>
						<a
							href="https://supabase.com/dashboard/project/{projectRef}/sql/new"
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-secondary btn-sm mt-3"
						>
							<Terminal size={15} /> Open SQL editor
						</a>
					</div>
				</div>
			</section>

			<section class="card p-5 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#BFE0FF] font-mono text-sm font-bold">2</span>
					<div class="min-w-0 flex-1">
						<h2 class="font-display text-xl font-extrabold">Run the schema</h2>
						<p class="mt-1 text-sm leading-relaxed text-ink-soft">
							Copy the contents of <code class="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[0.78rem]">supabase/setup.sql</code>
							from the project folder, paste it into the editor, and click <strong>Run</strong>. It creates the
							tables, triggers, row-level security policies and the private file bucket.
						</p>
						<button type="button" class="btn btn-secondary btn-sm mt-3" onclick={() => copy(schemaSnippet, 'schema')}>
							{#if copied === 'schema'}<Check size={15} /> Copied{:else}<Copy size={15} /> Copy reminder{/if}
						</button>
					</div>
				</div>
			</section>

			<section class="card p-5 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#BDEBCB] font-mono text-sm font-bold">3</span>
					<div class="min-w-0 flex-1">
						<h2 class="font-display text-xl font-extrabold">Add demo content</h2>
						<p class="mt-1 text-sm leading-relaxed text-ink-soft">
							Repeat the process with <code class="rounded bg-paper-deep px-1.5 py-0.5 font-mono text-[0.78rem]">supabase/seed.sql</code>.
							This adds departments, programs, subjects, topics, sample notes and community profiles so the
							app does not look empty on first load.
						</p>
					</div>
				</div>
			</section>

			<section class="card p-5 sm:p-6">
				<div class="flex items-start gap-3">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-[#FFC9DC] font-mono text-sm font-bold">4</span>
					<div class="min-w-0">
						<h2 class="font-display text-xl font-extrabold">Create your account</h2>
						<p class="mt-1 text-sm leading-relaxed text-ink-soft">
							Register with email and password. For local testing you can turn off email confirmation in
							Supabase under <strong>Authentication → Providers → Email</strong>, or keep it on and click the
							link in your inbox.
						</p>
						<div class="mt-3 flex flex-wrap gap-2">
							<a href="/register" class="btn btn-primary btn-sm">Create account</a>
							<a href="/login" class="btn btn-secondary btn-sm">I already have one</a>
						</div>
					</div>
				</div>
			</section>
			</div>
		{/if}

		<div class="mt-8 grid gap-4 sm:grid-cols-3">
			<div class="rounded-xl border-2 border-ink bg-paper-card p-4">
				<Database size={18} />
				<p class="mt-2 text-sm font-bold">Environment</p>
				<p class="mt-1 text-[0.75rem] leading-relaxed text-ink-soft">
					<code class="font-mono text-[0.68rem]">.env</code> already contains your project URL and publishable key.
				</p>
			</div>
			<div class="rounded-xl border-2 border-ink bg-paper-card p-4">
				<KeyRound size={18} />
				<p class="mt-2 text-sm font-bold">No service key needed</p>
				<p class="mt-1 text-[0.75rem] leading-relaxed text-ink-soft">
					All writes use the signed-in user's session and row-level security.
				</p>
			</div>
			<div class="rounded-xl border-2 border-ink bg-paper-card p-4">
				<MailCheck size={18} />
				<p class="mt-2 text-sm font-bold">Email confirmation</p>
				<p class="mt-1 text-[0.75rem] leading-relaxed text-ink-soft">
					Confirmation links return through <code class="font-mono text-[0.68rem]">/auth/callback</code>, already wired up.
				</p>
			</div>
		</div>

		<p class="mt-8 text-[0.7rem] leading-relaxed text-ink-soft">
			Still stuck? The project README contains the full setup guide, admin promotion SQL and troubleshooting notes.
		</p>
	</main>
</div>
