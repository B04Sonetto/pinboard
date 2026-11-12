<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { AlertCircle, ArrowLeft, LoaderCircle, Save, Target } from '@lucide/svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let submitting = $state(false);

	const saved = $derived(Boolean(form && 'saved' in form && form.saved));
	const titleValue = $derived(form && 'title' in form ? form.title : data.generation.title);
	const contentValue = $derived(form && 'content' in form ? form.content : data.generation.content);
</script>

<svelte:head><title>Edit {data.generation.title} · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Your generated study material"
		title="Edit reviewer"
		description="Customize the title and study content. Save your changes, or save and create an interactive quiz from the edited reviewer."
	>
		<a href="/study/{data.generation.id}" class="btn btn-secondary"><ArrowLeft size={15} /> Back to reviewer</a>
	</PageHeader>

	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" />
			<span>{form.error}</span>
		</div>
	{/if}

	{#if saved}
		<div class="rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]" role="status">
			Your reviewer changes were saved. You can try creating a quiz again.
		</div>
	{/if}

	<form
		method="POST"
		class="flex flex-col gap-5"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<section class="card flex flex-col gap-4 p-4 sm:p-6">
			<label class="flex flex-col gap-1.5">
				<span class="label">Reviewer title</span>
				<input class="input" type="text" name="title" minlength="4" maxlength="200" required value={titleValue} />
			</label>

			<label class="flex flex-col gap-1.5">
				<span class="label">Reviewer content</span>
				<textarea
					class="textarea min-h-[24rem] font-mono !text-sm leading-relaxed"
					name="content"
					rows="20"
					required
					minlength="80"
					maxlength="120000"
					aria-describedby="content-help"
				>{contentValue}</textarea>
				<span id="content-help" class="hint">Markdown is supported. Your edits are private to your account.</span>
			</label>
		</section>

		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<button type="submit" name="intent" value="save" class="btn btn-secondary" disabled={submitting}>
				{#if submitting}<LoaderCircle size={16} class="animate-spin" /> Saving…{:else}<Save size={16} /> Save reviewer{/if}
			</button>
			<button type="submit" name="intent" value="quiz" class="btn btn-primary" disabled={submitting}>
				{#if submitting}<LoaderCircle size={16} class="animate-spin" /> Saving…{:else}<Target size={16} /> Save &amp; take quiz{/if}
			</button>
		</div>
	</form>
</div>
