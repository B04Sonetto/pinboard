<script lang="ts">
	import { page } from '$app/state';
	import Logo from '$lib/components/Logo.svelte';
	import { ArrowLeft, Database, LifeBuoy } from '@lucide/svelte';

	const missingSchema = $derived(
		/relation|table|schema|does not exist|setup/i.test(page.error?.message ?? '')
	);
</script>

<div class="flex min-h-dvh items-center justify-center px-4 py-12">
	<div class="w-full max-w-lg">
		<div class="mb-6 flex justify-center"><Logo href={page.data.user ? '/dashboard' : '/login'} /></div>
		<div class="card card-raised p-6 sm:p-8">
			<p class="kicker">{page.status === 404 ? 'Page not found' : 'Something went wrong'} · {page.status}</p>
			<h1 class="display mt-2 text-3xl">
				{page.status === 404 ? 'That page is not on the board.' : 'We could not load this view.'}
			</h1>
			<p class="mt-3 text-sm leading-relaxed text-ink-soft">
				{page.error?.message ?? 'An unexpected error occurred. Try again in a moment.'}
			</p>

			{#if missingSchema}
				<div class="mt-5 rounded-xl border-2 border-ink bg-marigold-soft p-4">
					<div class="flex items-start gap-2">
						<Database size={18} class="mt-0.5 shrink-0" />
						<div>
							<p class="text-sm font-bold">The database is not set up yet.</p>
							<p class="mt-1 text-[0.8rem] leading-relaxed text-ink-soft">
								Run <code class="rounded border border-ink/20 bg-white px-1 font-mono text-[0.72rem]">supabase/setup.sql</code>
								in your Supabase SQL editor, then <code class="rounded border border-ink/20 bg-white px-1 font-mono text-[0.72rem]">supabase/seed.sql</code>
								for demo content.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<div class="mt-6 flex flex-wrap gap-2">
				<a href="/dashboard" class="btn btn-primary"><ArrowLeft size={16} /> Back to dashboard</a>
				<a href="/setup" class="btn btn-secondary"><LifeBuoy size={16} /> Setup guide</a>
			</div>
		</div>
	</div>
</div>
