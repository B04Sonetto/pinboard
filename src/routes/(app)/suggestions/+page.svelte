<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import {
		AlertCircle,
		BookOpen,
		CheckCircle2,
		Clock3,
		GraduationCap,
		Lightbulb,
		LoaderCircle,
		MessageSquarePlus,
		PenLine,
		Sparkles,
		Wrench,
		XCircle
	} from '@lucide/svelte';
	import { formatDate, suggestionStatusLabel } from '$lib/utils';
	import type { SuggestionKind, SuggestionStatus } from '$lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let kind = $state<SuggestionKind>('lesson');
	let submitting = $state(false);

	const kindOptions: { value: SuggestionKind; label: string; icon: typeof BookOpen; hint: string }[] = [
		{ value: 'course', label: 'New course', icon: GraduationCap, hint: 'A program or course that is missing.' },
		{ value: 'subject', label: 'New subject', icon: BookOpen, hint: 'A subject code or title to add.' },
		{ value: 'lesson', label: 'New lesson / topic', icon: PenLine, hint: 'A topic that belongs under a subject.' },
		{ value: 'correction', label: 'Correction', icon: Wrench, hint: 'Fix a wrong code, title or classification.' },
		{ value: 'platform', label: 'Platform feedback', icon: Lightbulb, hint: 'Something about how Pinboard works.' }
	];

	const kindIcon = (value: SuggestionKind) => kindOptions.find((item) => item.value === value)?.icon ?? Lightbulb;
	const kindLabel = (value: SuggestionKind) => kindOptions.find((item) => item.value === value)?.label ?? value;

	function statusClass(status: SuggestionStatus) {
		return status === 'accepted'
			? 'badge-verified'
			: status === 'declined'
				? 'badge-rejected'
				: status === 'under_review'
					? 'badge-neutral'
					: 'badge-submitted';
	}

	const errors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});
	const values = $derived(form && 'values' in form ? (form.values as Record<string, string>) : null);
</script>

<svelte:head><title>Suggestions · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader
		kicker="Community curriculum"
		title="Suggest a course or fix"
		description="Missing subject? Wrong course code? A topic that belongs under a lesson? Send it to the curriculum moderators. Accepted suggestions help shape the shared academic map."
	/>

	{#if form && 'success' in form && form.success}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]" role="status">
			<CheckCircle2 size={17} class="mt-0.5 shrink-0" /> {form.message}
		</div>
	{/if}
	{#if form && 'error' in form && form.error}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {form.error}
		</div>
	{/if}

	<div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-marigold-soft"><Clock3 size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.open}</p><p class="text-[0.65rem] font-semibold text-ink-soft">Open</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-sky"><Sparkles size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.under_review}</p><p class="text-[0.65rem] font-semibold text-ink-soft">Under review</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-leaf"><CheckCircle2 size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.accepted}</p><p class="text-[0.65rem] font-semibold text-ink-soft">Accepted</p></div>
		</div>
		<div class="card flex items-center gap-2.5 p-3">
			<span class="flex h-8 w-8 items-center justify-center rounded border-2 border-ink bg-coral"><XCircle size={15} /></span>
			<div><p class="stat-value !text-xl">{data.counts.declined}</p><p class="text-[0.65rem] font-semibold text-ink-soft">Declined</p></div>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
		<section class="card overflow-hidden">
			<div class="flex items-center gap-2 border-b-2 border-ink bg-[#F3EDDD] px-4 py-3">
				<Lightbulb size={17} />
				<h2 class="font-display text-lg font-extrabold">Your suggestions</h2>
				<span class="ml-auto font-mono text-[0.62rem] text-ink-soft">{data.counts.total} total</span>
			</div>

			{#if data.suggestions.length}
				<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
					{#each data.suggestions as suggestion (suggestion.id)}
						{@const Icon = kindIcon(suggestion.kind)}
						<li class="p-4">
							<div class="flex items-start gap-3">
								<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-paper">
									<Icon size={16} />
								</span>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-1.5">
										<span class="badge {statusClass(suggestion.status)} !text-[0.55rem]">{suggestionStatusLabel(suggestion.status)}</span>
										<span class="font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">{kindLabel(suggestion.kind)}</span>
										{#if suggestion.subject}
											<span class="chip chip-soft !min-h-5 !text-[0.6rem]">{suggestion.subject.code}</span>
										{/if}
									</div>
									<h3 class="mt-1 text-[0.9rem] font-bold leading-snug">{suggestion.title}</h3>
									<p class="mt-1 whitespace-pre-line text-[0.78rem] leading-relaxed text-ink-soft">{suggestion.details}</p>
									{#if suggestion.admin_note}
										<div class="mt-2 rounded-lg border-l-4 border-violet bg-[#F4F0FF] px-3 py-2">
											<p class="font-mono text-[0.55rem] uppercase tracking-[0.08em] text-violet">Moderator note</p>
											<p class="mt-0.5 text-[0.75rem] leading-relaxed text-ink-soft">{suggestion.admin_note}</p>
										</div>
									{/if}
									<p class="mt-1.5 font-mono text-[0.58rem] uppercase tracking-[0.06em] text-ink-faint">
										Sent {formatDate(suggestion.created_at)}
										{#if suggestion.updated_at !== suggestion.created_at}· Updated {formatDate(suggestion.updated_at)}{/if}
									</p>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{:else}
				<div class="p-4">
					<EmptyState
						title="No suggestions yet"
						description="If something in the curriculum map is missing or mislabeled, tell the moderators using the form."
						icon={MessageSquarePlus}
					/>
				</div>
			{/if}
		</section>

		<aside class="flex flex-col gap-4">
			<form
				method="POST"
				action="?/create"
				class="card flex flex-col gap-4 p-4 sm:p-5"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						await update();
						submitting = false;
					};
				}}
			>
				<div>
					<p class="kicker !text-[0.6rem]">New suggestion</p>
					<h2 class="mt-1 font-display text-lg font-extrabold">What needs to change?</h2>
				</div>

				<fieldset>
					<legend class="label">Type</legend>
					<div class="grid gap-1.5">
						{#each kindOptions as option (option.value)}
							<label
								class="flex cursor-pointer items-start gap-2 rounded-lg border-2 border-ink/25 bg-paper px-2.5 py-2 transition has-[:checked]:border-ink has-[:checked]:bg-marigold-soft"
							>
								<input type="radio" name="kind" value={option.value} bind:group={kind} class="mt-0.5 h-3.5 w-3.5 accent-[#211D31]" />
								<span class="min-w-0">
									<span class="flex items-center gap-1.5 text-[0.76rem] font-bold"><option.icon size={13} /> {option.label}</span>
									<span class="block text-[0.66rem] leading-snug text-ink-soft">{option.hint}</span>
								</span>
							</label>
						{/each}
					</div>
					{#if errors.kind}<p class="field-error">{errors.kind}</p>{/if}
				</fieldset>

				<label class="flex flex-col">
					<span class="label">Title</span>
					<input
						class="input"
						type="text"
						name="title"
						maxlength="140"
						value={values?.title ?? ''}
						placeholder="e.g. Add CS 214 · Human-Computer Interaction"
						required
					/>
					{#if errors.title}<span class="field-error">{errors.title}</span>{/if}
				</label>

				<label class="flex flex-col">
					<span class="label">Related subject (optional)</span>
					<select class="select" name="subject_id">
						<option value="">Not subject-specific</option>
						{#each data.subjects as subject (subject.id)}
							<option value={subject.id} selected={values?.subject_id === subject.id}>{subject.code} · {subject.name}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col">
					<span class="label">Details</span>
					<textarea
						class="textarea min-h-[7.5rem]"
						name="details"
						maxlength="4000"
						rows="5"
						placeholder="What is missing or wrong? Add the exact code, title, year level, or a link to the official course list if you have one."
						required
					>{values?.details ?? ''}</textarea>
					{#if errors.details}<span class="field-error">{errors.details}</span>{/if}
				</label>

				<div class="rounded-lg border-2 border-dashed border-ink/25 bg-paper-deep/60 px-3 py-2">
					<p class="text-[0.66rem] leading-relaxed text-ink-soft">
						Suggestions are community input, not official university records. Moderators verify against public course
						listings before adding anything.
					</p>
				</div>

				<button type="submit" class="btn btn-primary" disabled={submitting}>
					{#if submitting}<LoaderCircle size={16} class="animate-spin" /> Sending…{:else}<MessageSquarePlus size={16} /> Send suggestion{/if}
				</button>
			</form>

			<div class="rounded-xl border-2 border-ink bg-paper-card p-4">
				<p class="flex items-center gap-1.5 text-[0.8rem] font-bold"><Clock3 size={15} /> What happens next?</p>
				<ol class="mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-[0.72rem] leading-relaxed text-ink-soft">
					<li>A moderator reviews it against public course information.</li>
					<li>Status moves to <strong>under review</strong> while it is being checked.</li>
					<li>Accepted items are added to the curriculum map; declined items get a note explaining why.</li>
				</ol>
			</div>
		</aside>
	</div>
</div>
