<script lang="ts">
	import type { PageData } from './$types';
	import { AlertCircle, ArrowLeft, CheckCircle2, History, LoaderCircle, RotateCcw, Sparkles, Target, XCircle } from '@lucide/svelte';
	import { formatDate } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	const questions = $derived(data.quiz.payload.questions ?? []);

	type Result = {
		id: string;
		chosen: number;
		answer: number;
		correct: boolean;
		explanation: string;
		options: string[];
	};

	let answers = $state<Record<string, number>>({});
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
	let results = $state<Result[] | null>(null);
	let score = $state(0);
	let total = $state(0);

	const answeredCount = $derived(questions.filter((question) => answers[question.id] !== undefined).length);
	const allAnswered = $derived(answeredCount === questions.length);
	const percent = $derived(total ? Math.round((score / total) * 100) : 0);

	function choose(questionId: string, optionIndex: number) {
		if (results) return;
		answers[questionId] = optionIndex;
	}

	async function submit() {
		if (!allAnswered || submitting) return;
		submitting = true;
		errorMessage = null;
		try {
			const response = await fetch('/api/quiz-attempt', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ generationId: data.quiz.id, answers })
			});
			const payload = await response.json();
			if (!response.ok) {
				errorMessage = payload?.error ?? 'Could not check your answers. Try again.';
				return;
			}
			results = payload.results as Result[];
			score = payload.score;
			total = payload.total;
			document.getElementById('quiz-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} catch {
			errorMessage = 'Network error. Check your connection and try again.';
		} finally {
			submitting = false;
		}
	}

	function retry() {
		answers = {};
		results = null;
		score = 0;
		total = 0;
		errorMessage = null;
		document.getElementById('quiz-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	const resultFor = $derived(new Map((results ?? []).map((result) => [result.id, result])));
	const scoreTone = $derived(percent >= 80 ? 'good' : percent >= 50 ? 'mid' : 'low');
</script>

<svelte:head>
	<title>Quiz · {data.quiz.title} · Pinboard</title>
</svelte:head>

<div id="quiz-top" class="flex flex-col gap-5">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft" aria-label="Breadcrumb">
		<a href="/study" class="hover:text-ink hover:underline">AI Study Assistant</a>
		<span class="text-ink-faint">/</span>
		<a href="/study/{data.quiz.id}" class="hover:text-ink hover:underline">Generation</a>
		<span class="text-ink-faint">/</span>
		<span class="text-ink">Practice quiz</span>
	</nav>

	<header class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<span class="badge badge-ai"><span aria-hidden="true">✦</span> AI Generated</span>
			<span class="badge badge-neutral">{questions.length} questions</span>
			{#if data.quiz.subject}<a href="/courses/{data.quiz.subject.id}" class="chip !min-h-6 !text-[0.66rem] hover:bg-marigold">{data.quiz.subject.code}</a>{/if}
			{#if data.quiz.topic}<span class="chip chip-soft !min-h-6 !text-[0.66rem]">{data.quiz.topic.name}</span>{/if}
		</div>
		<h1 class="display max-w-4xl text-[1.8rem] leading-[1.07] sm:text-[2.35rem]">{data.quiz.title}</h1>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<p class="max-w-2xl text-[0.82rem] leading-relaxed text-ink-soft">
				Choose one answer per question, then check your answers. Explanations quote the source notes so you can trace each
				item.
			</p>
			<a href="/study/{data.quiz.id}" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to reviewer</a>
		</div>
	</header>

	{#if data.previousAttempts.length && !results}
		<div class="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-ink/35 bg-paper-card px-4 py-2.5">
			<History size={15} class="text-ink-soft" />
			<span class="text-[0.72rem] text-ink-soft">Recent:</span>
			{#each data.previousAttempts as attempt (attempt.id)}
				<span class="badge badge-neutral !text-[0.55rem]">
					{Math.round((attempt.score / attempt.total) * 100)}% · {formatDate(attempt.created_at)}
				</span>
			{/each}
		</div>
	{/if}

	{#if results}
		{@const heading = scoreTone === 'good' ? 'Strong recall' : scoreTone === 'mid' ? 'Getting there' : 'Worth another pass'}
		<div
			class="card overflow-hidden"
			class:border-[#1C7A50]={scoreTone === 'good'}
			class:border-[#B42318]={scoreTone === 'low'}
		>
			<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
					<span
						class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink font-display text-[1.35rem] font-extrabold"
						class:bg-leaf={scoreTone === 'good'}
						class:bg-marigold={scoreTone === 'mid'}
						class:bg-coral={scoreTone === 'low'}
					>
						{percent}%
					</span>
					<div>
						<p class="kicker !text-[0.6rem]">Attempt saved</p>
						<h2 class="mt-0.5 font-display text-xl font-extrabold">{heading}</h2>
						<p class="mt-0.5 text-[0.8rem] text-ink-soft">You answered {score} of {total} correctly.</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<button type="button" class="btn btn-secondary btn-sm" onclick={retry}><RotateCcw size={14} /> Try again</button>
					<a href="/study/{data.quiz.id}" class="btn btn-primary btn-sm"><Sparkles size={14} /> Back to reviewer</a>
				</div>
			</div>
			<div class="border-t-2 border-ink bg-[#F3EDDD] px-5 py-2.5 text-[0.72rem] text-ink-soft">
				Review only the items you missed, then explain each correct answer out loud without reading.
			</div>
		</div>
	{:else}
		<div class="sticky top-16 z-10 flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-paper-card px-4 py-2.5 shadow-[3px_3px_0_#211D31]">
			<Target size={16} />
			<span class="text-[0.78rem] font-bold">{answeredCount} / {questions.length} answered</span>
			<div class="h-2 min-w-24 flex-1 overflow-hidden rounded-full border border-ink bg-paper">
				<div class="h-full bg-marigold transition-all" style="width: {questions.length ? (answeredCount / questions.length) * 100 : 0}%"></div>
			</div>
			<button type="button" class="btn btn-primary btn-sm" disabled={!allAnswered || submitting} onclick={submit}>
				{#if submitting}<LoaderCircle size={14} class="animate-spin" /> Checking…{:else}Check answers{/if}
			</button>
		</div>
	{/if}

	{#if errorMessage}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {errorMessage}
		</div>
	{/if}

	<ol class="flex flex-col gap-4">
		{#each questions as question, index (question.id)}
			{@const result = resultFor.get(question.id)}
			{@const chosen = answers[question.id]}
			{@const correct = result?.correct ?? false}
			<li
				class="card p-4 sm:p-5"
				class:border-[#1C7A50]={result && correct}
				class:border-[#B42318]={result && !correct}
			>
				<div class="flex items-start gap-3">
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-ink font-mono text-[0.68rem] font-bold"
						class:bg-leaf={result && correct}
						class:bg-coral={result && !correct}
						class:bg-marigold={!result}
					>
						{#if result}{#if correct}✓{:else}×{/if}{:else}{index + 1}{/if}
					</span>
					<div class="min-w-0 flex-1">
						<p class="text-[0.92rem] font-semibold leading-relaxed">{question.prompt}</p>

						<div class="mt-3 grid gap-2 sm:grid-cols-2">
							{#each question.options as option, optionIndex (optionIndex)}
								{@const isChosen = chosen === optionIndex}
								{@const isCorrectOption = result?.answer === optionIndex}
								<button
									type="button"
									class="flex items-start gap-2 rounded-lg border-2 border-ink/30 bg-paper px-3 py-2 text-left text-[0.8rem] font-medium transition hover:border-ink"
									class:border-ink={isChosen && !result}
									class:bg-marigold-soft={isChosen && !result}
									class:!border-[#1C7A50]={result && isCorrectOption}
									class:!bg-[#EFFBF3]={result && isCorrectOption}
									class:!border-[#B42318]={result && isChosen && !isCorrectOption}
									class:!bg-[#FFF1EF]={result && isChosen && !isCorrectOption}
									disabled={Boolean(results)}
									onclick={() => choose(question.id, optionIndex)}
								>
									<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ink/50 font-mono text-[0.58rem] font-bold">
										{String.fromCharCode(65 + optionIndex)}
									</span>
									<span class="min-w-0">
										{option}
										{#if result && isCorrectOption}
											<span class="ml-1.5 inline-flex items-center gap-0.5 text-[0.62rem] font-bold text-[#1C7A50]"><CheckCircle2 size={11} /> correct</span>
										{:else if result && isChosen}
											<span class="ml-1.5 inline-flex items-center gap-0.5 text-[0.62rem] font-bold text-[#B42318]"><XCircle size={11} /> your choice</span>
										{/if}
									</span>
								</button>
							{/each}
						</div>

						{#if result}
							<div class="mt-3 rounded-lg border-2 border-dashed border-ink/25 bg-paper-deep/50 p-3">
								<p class="text-[0.76rem] leading-relaxed text-ink-soft">
									<strong class="text-ink">Why:</strong> {result.explanation}
								</p>
								{#if question.sourceNoteId && question.sourceTitle}
									<a href="/notes/{question.sourceNoteId}" class="mt-1.5 inline-block text-[0.68rem] font-bold text-violet hover:underline">
										Source: {question.sourceTitle} →
									</a>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</li>
		{/each}
	</ol>

	{#if !results}
		<div class="flex flex-col items-center gap-2">
			{#if !allAnswered}
				<p class="text-[0.72rem] text-ink-soft">Answer all {questions.length} questions to check your score.</p>
			{/if}
			<button type="button" class="btn btn-primary btn-lg" disabled={!allAnswered || submitting} onclick={submit}>
				{#if submitting}<LoaderCircle size={17} class="animate-spin" /> Checking your answers…{:else}Check answers{/if}
			</button>
		</div>
	{/if}

	<div class="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/30 px-4 py-3">
		<AlertCircle size={16} class="mt-0.5 shrink-0 text-ink-soft" />
		<p class="text-[0.7rem] leading-relaxed text-ink-soft">
			Quiz items are machine-generated from community notes. They may be ambiguous or uneven in difficulty. Use them for
			recall practice, never as an official answer key.
		</p>
	</div>
</div>
