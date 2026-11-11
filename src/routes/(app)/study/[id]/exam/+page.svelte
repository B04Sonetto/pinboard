<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import type { PageData } from './$types';
	import {
		AlertCircle,
		ArrowLeft,
		CheckCircle2,
		Clock3,
		LoaderCircle,
		Send,
		Sparkles,
		Target,
		XCircle
	} from '@lucide/svelte';
	import { formatDate } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	type ObjectiveResult = {
		id: string;
		chosen: number;
		answer: number;
		correct: boolean;
		explanation: string;
		options: string[];
	};
	type IdentificationResult = {
		id: string;
		chosen: string;
		answer: string;
		correct: boolean;
		explanation: string;
	};
	type ExamResponse = {
		score: number;
		total: number;
		objectiveTotal: number;
		identificationTotal: number;
		essayCount: number;
		results: ObjectiveResult[];
		identificationResults: IdentificationResult[];
	};

	const exam = $derived(data.exam);
	const objectiveTotal = $derived(exam.questions.length);
	const identificationTotal = $derived(exam.identification.length);
	const essayTotal = $derived(exam.essays.length);
	const totalSeconds = $derived(Math.max(5, exam.config.timeLimitMinutes ?? 45) * 60);

	let remaining = $state(untrack(() => totalSeconds));
	let answersObjective = $state<Record<string, number>>({});
	let answersIdentification = $state<Record<string, string>>({});
	let answersEssay = $state<Record<string, string>>({});
	let submitting = $state(false);
	let submitted = $state(false);
	let timeExpired = $state(false);
	let errorMessage = $state<string | null>(null);
	let results = $state<ExamResponse | null>(null);
	let timer: ReturnType<typeof setInterval> | undefined;

	const answeredObjective = $derived(exam.questions.filter((question) => answersObjective[question.id] !== undefined).length);
	const answeredIdentification = $derived(
		exam.identification.filter((question) => (answersIdentification[question.id] ?? '').trim().length > 0).length
	);
	const answeredEssays = $derived(
		exam.essays.filter((essay) => (answersEssay[essay.id] ?? '').trim().length > 0).length
	);
	const answeredCount = $derived(answeredObjective + answeredIdentification + answeredEssays);
	const totalItems = $derived(objectiveTotal + identificationTotal + essayTotal);
	const percent = $derived(results && results.total ? Math.round((results.score / results.total) * 100) : 0);
	const resultFor = $derived(new Map((results?.results ?? []).map((result) => [result.id, result])));
	const identificationResultFor = $derived(
		new Map((results?.identificationResults ?? []).map((result) => [result.id, result]))
	);

	function formatTime(seconds: number) {
		const safe = Math.max(0, seconds);
		const minutes = Math.floor(safe / 60);
		const remainder = safe % 60;
		return `${minutes}:${String(remainder).padStart(2, '0')}`;
	}

	function choose(questionId: string, optionIndex: number) {
		if (submitted) return;
		answersObjective = { ...answersObjective, [questionId]: optionIndex };
	}

	function stopTimer() {
		if (timer) clearInterval(timer);
		timer = undefined;
	}

	async function submit(auto = false) {
		if (submitting || submitted) return;
		if (auto) timeExpired = true;
		submitting = true;
		errorMessage = null;
		stopTimer();
		try {
			const response = await fetch('/api/exam-attempt', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					generationId: exam.id,
					answers: {
						objective: answersObjective,
						identification: answersIdentification,
						essays: answersEssay
					}
				})
			});
			const payload = (await response.json()) as ExamResponse & { error?: string };
			if (!response.ok) {
				errorMessage = payload.error ?? 'Could not submit the exam. Try again.';
				return;
			}
			results = payload;
			submitted = true;
			document.getElementById('exam-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		} catch {
			errorMessage = 'Network error. Check your connection and submit again.';
		} finally {
			submitting = false;
		}
	}

	function retry() {
		window.location.reload();
	}

	onMount(() => {
		timer = setInterval(() => {
			if (submitted || submitting) return;
			remaining -= 1;
			if (remaining <= 0) {
				remaining = 0;
				void submit(true);
			}
		}, 1000);
		return stopTimer;
	});
</script>

<svelte:head>
	<title>Exam · {exam.title} · Pinboard</title>
</svelte:head>

<div id="exam-top" class="flex flex-col gap-5">
	<nav class="flex flex-wrap items-center gap-1.5 text-[0.72rem] font-semibold text-ink-soft" aria-label="Breadcrumb">
		<a href="/study" class="hover:text-ink hover:underline">AI Study Assistant</a>
		<span class="text-ink-faint">/</span>
		<a href="/study/{exam.id}" class="hover:text-ink hover:underline">Exam material</a>
		<span class="text-ink-faint">/</span>
		<span class="text-ink">Practice exam</span>
	</nav>

	<header class="flex flex-col gap-3">
		<div class="flex flex-wrap items-center gap-2">
			<span class="badge badge-ai"><span aria-hidden="true">✦</span> AI Generated</span>
			<span class="badge badge-neutral">Timed exam</span>
			{#if exam.subject}<a href="/courses/{exam.subject.id}" class="chip !min-h-6 !text-[0.66rem] hover:bg-marigold">{exam.subject.code}</a>{/if}
			{#if exam.topic}<span class="chip chip-soft !min-h-6 !text-[0.66rem]">{exam.topic.name}</span>{/if}
		</div>
		<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
			<div class="min-w-0">
				<h1 class="display max-w-4xl text-[1.8rem] leading-[1.07] sm:text-[2.35rem]">{exam.title}</h1>
				<p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.74rem] text-ink-soft">
					<span>Generated {formatDate(exam.createdAt)}</span>
					<span>{objectiveTotal} objective</span>
					{#if identificationTotal}<span>{identificationTotal} identification</span>{/if}
					{#if essayTotal}<span>{essayTotal} essay prompt{essayTotal === 1 ? '' : 's'}</span>{/if}
				</p>
			</div>
			<a href="/study/{exam.id}" class="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Back to material</a>
		</div>
	</header>

	{#if data.previousAttempts.length && !submitted}
		<div class="flex flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-ink/35 bg-paper-card px-4 py-2.5">
			<Clock3 size={15} class="text-ink-soft" />
			<span class="text-[0.72rem] text-ink-soft">Previous attempts:</span>
			{#each data.previousAttempts as attempt (attempt.id)}
				<span class="badge badge-neutral !text-[0.55rem]">{Math.round((attempt.score / Math.max(1, attempt.total)) * 100)}% · {formatDate(attempt.created_at)}</span>
			{/each}
		</div>
	{/if}

	{#if submitted && results}
		<div class="card overflow-hidden border-[#1C7A50]">
			<div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
				<div class="flex items-center gap-4">
					<span class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-leaf font-display text-[1.35rem] font-extrabold">
						{percent}%
					</span>
					<div>
						<p class="kicker !text-[0.6rem]">{timeExpired ? 'Time expired — auto-submitted' : 'Exam submitted'}</p>
						<h2 class="mt-0.5 font-display text-xl font-extrabold">{percent >= 80 ? 'Strong recall' : percent >= 50 ? 'Getting there' : 'Worth another pass'}</h2>
						<p class="mt-0.5 text-[0.8rem] text-ink-soft">
							You scored {results.score} of {results.total} objective + identification points.
							{#if results.essayCount > 0} {results.essayCount} essay response{results.essayCount === 1 ? '' : 's'} saved for self-review.{/if}
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<button type="button" class="btn btn-secondary btn-sm" onclick={retry}>Take again</button>
					<a href="/study/{exam.id}" class="btn btn-primary btn-sm"><Sparkles size={14} /> Back to material</a>
				</div>
			</div>
		</div>
	{:else}
		<div class="sticky top-16 z-10 flex flex-wrap items-center gap-3 rounded-xl border-2 border-ink bg-paper-card px-4 py-2.5 shadow-[3px_3px_0_#211D31]">
			<Clock3 size={17} class={remaining <= 300 ? 'text-[#B42318]' : ''} />
			<span class="font-mono text-[0.9rem] font-bold" class:!text-[#B42318]={remaining <= 300}>{formatTime(remaining)}</span>
			<span class="text-[0.72rem] text-ink-soft">{answeredCount} / {totalItems} answered</span>
			<div class="h-2 min-w-24 flex-1 overflow-hidden rounded-full border border-ink bg-paper">
				<div class="h-full bg-marigold transition-all" style="width: {totalItems ? (answeredCount / totalItems) * 100 : 0}%"></div>
			</div>
			<button type="button" class="btn btn-primary btn-sm" disabled={submitting} onclick={() => submit()}>
				{#if submitting}<LoaderCircle size={14} class="animate-spin" /> Submitting…{:else}<Send size={14} /> Submit exam{/if}
			</button>
		</div>
	{/if}

	{#if errorMessage}
		<div class="flex items-start gap-2 rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">
			<AlertCircle size={17} class="mt-0.5 shrink-0" /> {errorMessage}
		</div>
	{/if}

	{#if objectiveTotal}
		<section>
			<div class="mb-3 flex items-end justify-between gap-2">
				<div>
					<p class="kicker">Part I</p>
					<h2 class="mt-1 font-display text-xl font-extrabold">Multiple choice / true or false</h2>
				</div>
				<span class="font-mono text-[0.62rem] text-ink-soft">{answeredObjective} / {objectiveTotal}</span>
			</div>
			<ol class="flex flex-col gap-4">
				{#each exam.questions as question, index (question.id)}
					{@const result = resultFor.get(question.id)}
					{@const chosen = answersObjective[question.id]}
					<li class="card p-4 sm:p-5" class:border-[#1C7A50]={result?.correct} class:border-[#B42318]={result && !result.correct}>
						<div class="flex items-start gap-3">
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-ink font-mono text-[0.68rem] font-bold" class:bg-leaf={result?.correct} class:bg-coral={result && !result.correct} class:bg-marigold={!result}>
								{#if result}{#if result.correct}✓{:else}×{/if}{:else}{index + 1}{/if}
							</span>
							<div class="min-w-0 flex-1">
								<p class="text-[0.92rem] font-semibold leading-relaxed">{question.prompt}</p>
								{#if question.sourceNoteId && question.sourceTitle}
									<a href="/notes/{question.sourceNoteId}" class="mt-1 inline-block text-[0.68rem] font-bold text-violet hover:underline">Source: {question.sourceTitle} →</a>
								{/if}
								<div class="mt-3 grid gap-2 sm:grid-cols-2">
									{#each question.options as option, optionIndex (optionIndex)}
										{@const isChosen = chosen === optionIndex}
										{@const isCorrect = result?.answer === optionIndex}
										<button
											type="button"
											class="flex items-start gap-2 rounded-lg border-2 border-ink/30 bg-paper px-3 py-2 text-left text-[0.8rem] font-medium transition hover:border-ink"
											class:border-ink={isChosen && !result}
											class:bg-marigold-soft={isChosen && !result}
											class:!border-[#1C7A50]={result && isCorrect}
											class:!bg-[#EFFBF3]={result && isCorrect}
											class:!border-[#B42318]={result && isChosen && !isCorrect}
											class:!bg-[#FFF1EF]={result && isChosen && !isCorrect}
											disabled={Boolean(results)}
											onclick={() => choose(question.id, optionIndex)}
										>
											<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ink/50 font-mono text-[0.58rem] font-bold">{String.fromCharCode(65 + optionIndex)}</span>
											<span class="min-w-0">{option}</span>
										</button>
									{/each}
								</div>
								{#if result}<div class="mt-3 rounded-lg border-2 border-dashed border-ink/25 bg-paper-deep/50 p-3 text-[0.76rem] leading-relaxed text-ink-soft"><strong class="text-ink">Why:</strong> {result.explanation}</div>{/if}
							</div>
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if identificationTotal}
		<section>
			<div class="mb-3 flex items-end justify-between gap-2">
				<div>
					<p class="kicker">Part II</p>
					<h2 class="mt-1 font-display text-xl font-extrabold">Identification</h2>
				</div>
				<span class="font-mono text-[0.62rem] text-ink-soft">{answeredIdentification} / {identificationTotal}</span>
			</div>
			<ol class="flex flex-col gap-4">
				{#each exam.identification as question, index (question.id)}
					{@const result = identificationResultFor.get(question.id)}
					<li class="card p-4 sm:p-5" class:border-[#1C7A50]={result?.correct} class:border-[#B42318]={result && !result.correct}>
						<div class="flex items-start gap-3">
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-ink bg-sky font-mono text-[0.68rem] font-bold">{index + 1}</span>
							<div class="min-w-0 flex-1">
								<p class="text-[0.92rem] font-semibold leading-relaxed">{question.prompt}</p>
								{#if question.sourceNoteId && question.sourceTitle}
									<a href="/notes/{question.sourceNoteId}" class="mt-1 inline-block text-[0.68rem] font-bold text-violet hover:underline">Source: {question.sourceTitle} →</a>
								{/if}
								<input
									class="input mt-2 !min-h-10 !text-sm"
									type="text"
									placeholder="Type the missing term"
									value={answersIdentification[question.id] ?? ''}
									disabled={Boolean(results)}
									oninput={(event) => (answersIdentification = { ...answersIdentification, [question.id]: (event.currentTarget as HTMLInputElement).value })}
								/>
								{#if result}
									<div class="mt-2 rounded-lg border-2 border-dashed border-ink/25 bg-paper-deep/50 p-3 text-[0.76rem] leading-relaxed text-ink-soft">
										<strong class="text-ink">{result.correct ? 'Correct.' : `Answer: ${result.answer}.`}</strong> {result.explanation}
									</div>
								{/if}
							</div>
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if essayTotal}
		<section>
			<div class="mb-3 flex items-end justify-between gap-2">
				<div>
					<p class="kicker">Part III</p>
					<h2 class="mt-1 font-display text-xl font-extrabold">Essay</h2>
				</div>
				<span class="font-mono text-[0.62rem] text-ink-soft">{answeredEssays} / {essayTotal}</span>
			</div>
			<p class="mb-3 rounded-lg border border-dashed border-ink/25 bg-paper px-3 py-2 text-[0.72rem] leading-relaxed text-ink-soft">Essay answers are saved for your own review and are not automatically scored.</p>
			<ol class="flex flex-col gap-4">
				{#each exam.essays as essay, index (essay.id)}
					<li class="card p-4 sm:p-5">
						<div class="flex items-start gap-3">
							<span class="flex h-7 w-7 shrink-0 items-center justify-center rounded border-2 border-ink bg-lilac font-mono text-[0.68rem] font-bold">{index + 1}</span>
							<div class="min-w-0 flex-1">
								<p class="text-[0.92rem] font-semibold leading-relaxed">{essay.prompt}</p>
								<p class="mt-1 text-[0.72rem] italic leading-relaxed text-ink-soft">{essay.guidance}</p>
								{#if essay.sourceNoteId && essay.sourceTitle}
									<a href="/notes/{essay.sourceNoteId}" class="mt-1 inline-block text-[0.68rem] font-bold text-violet hover:underline">Source: {essay.sourceTitle} →</a>
								{/if}
								<textarea
									class="textarea mt-2 min-h-[9rem]"
									rows="5"
									placeholder="Write your answer here…"
									value={answersEssay[essay.id] ?? ''}
									disabled={Boolean(results)}
									oninput={(event) => (answersEssay = { ...answersEssay, [essay.id]: (event.currentTarget as HTMLTextAreaElement).value })}
								></textarea>
							</div>
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	{#if !submitted}
		<div class="flex flex-col items-center gap-2">
			<p class="text-[0.72rem] text-ink-soft">You can submit with unanswered items. Your objective and identification answers will be scored.</p>
			<button type="button" class="btn btn-primary btn-lg" disabled={submitting} onclick={() => submit()}>
				{#if submitting}<LoaderCircle size={17} class="animate-spin" /> Submitting exam…{:else}<Send size={17} /> Submit exam{/if}
			</button>
		</div>
	{/if}

	<div class="flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/30 px-4 py-3">
		<AlertCircle size={16} class="mt-0.5 shrink-0 text-ink-soft" />
		<p class="text-[0.7rem] leading-relaxed text-ink-soft">
			This practice exam is machine-generated from community notes. It is not an official exam, and essay responses are not automatically graded.
		</p>
	</div>
</div>
