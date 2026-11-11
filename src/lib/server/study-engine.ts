import type { Flashcard, NoteStatus, QuizQuestion, StudyDifficulty, StudyKind, StudyPayload } from '$lib/types';
import { extractKeywords, tokenize } from '$lib/keywords';
import { stripMarkdown, truncate } from '$lib/utils';

export const ENGINE = 'pinboard-extractive-v2';

export interface StudySource {
	id: string;
	title: string;
	status: NoteStatus;
	summary?: string | null;
	content: string;
	keywords?: string[] | null;
	subject?: string | null;
	topic?: string | null;
}

export interface StudyOptions {
	ownNotes?: string;
	questionCount?: number;
	focus?: string;
	difficulty?: StudyDifficulty;
}

export interface StudyResult {
	title: string;
	content: string;
	payload: StudyPayload;
}

const STOP_SENTENCE = /^(see |note:|tip:|remember:|practice:|example:)/i;

function cleanText(value: string): string {
	return value
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/[#>*_`~]/g, ' ')
		.replace(/\r/g, '')
		.replace(/[ \t]+/g, ' ')
		.trim();
}

function splitSentences(text: string): string[] {
	const cleaned = cleanText(text);
	return cleaned
		.split(/(?<=[.!?])\s+|\n+/)
		.map((sentence) => sentence.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').trim())
		.filter((sentence) => sentence.length > 40 && sentence.length < 420)
		.filter((sentence) => /[a-z]/i.test(sentence));
}

function sentenceScore(sentence: string, terms: Set<string>, index: number): number {
	const tokens = tokenize(sentence);
	if (tokens.length < 5) return -1;
	let score = 0;
	for (const token of new Set(tokens)) {
		if (terms.has(token)) score += 1;
	}
	score += Math.min(tokens.length, 24) / 30;
	score += Math.max(0, 3 - index * 0.08);
	return score;
}

function rankedSentences(text: string, limit: number, focusTerms: string[] = []): string[] {
	const sentences = splitSentences(text);
	if (sentences.length === 0) return [];
	const keywords = extractKeywords(text, 24).map((item) => item.term);
	for (const term of focusTerms) {
		for (const token of tokenize(term)) keywords.push(token);
	}
	const terms = new Set(keywords.flatMap((term) => term.split(' ')));
	const ranked = sentences
		.map((sentence, index) => ({ sentence, index, score: sentenceScore(sentence, terms, index) }))
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score || a.index - b.index);

	const chosen: { sentence: string; index: number }[] = [];
	const seen = new Set<string>();
	for (const item of ranked) {
		const fingerprint = item.sentence.toLowerCase().slice(0, 60);
		if (seen.has(fingerprint)) continue;
		seen.add(fingerprint);
		chosen.push(item);
		if (chosen.length >= limit) break;
	}
	return chosen.sort((a, b) => a.index - b.index).map((item) => item.sentence);
}

function noteLabel(source: StudySource): string {
	const parts = [source.subject, source.topic].filter(Boolean);
	return parts.length ? parts.join(' · ') : source.title;
}

function focusList(options: StudyOptions): string[] {
	if (!options.focus) return [];
	return options.focus
		.split(/[,;\n]/)
		.map((term) => term.trim())
		.filter((term) => term.length > 2);
}

const DIFFICULTY = {
	easy: { reviewerPoints: 5, summaryPoints: 4, checks: 2, minSentence: 60 },
	standard: { reviewerPoints: 7, summaryPoints: 5, checks: 3, minSentence: 70 },
	challenge: { reviewerPoints: 9, summaryPoints: 6, checks: 4, minSentence: 100 }
} as const;

function level(options: StudyOptions) {
	return DIFFICULTY[options.difficulty ?? 'standard'] ?? DIFFICULTY.standard;
}

function sentenceLink(source: StudySource): string {
	return `[Read the source note](/notes/${source.id})`;
}

function combinedText(sources: StudySource[], options: StudyOptions): string {
	return [
		...sources.map((source) => `${source.title}\n${source.summary ?? ''}\n${source.content}`),
		options.ownNotes ?? ''
	].join('\n\n');
}

function buildSummary(sources: StudySource[], options: StudyOptions): StudyResult {
	const focus = focusList(options);
	const contentParts: string[] = [
		'# Lesson summary',
		'',
		`Built from ${sources.length} community ${sources.length === 1 ? 'note' : 'notes'}${options.ownNotes ? ' plus your attached notes' : ''}. Read this as a study aid, not as official course material.`,
		''
	];

	for (const source of sources) {
		const points = rankedSentences(source.content, level(options).summaryPoints, focus);
		contentParts.push(`## ${source.title}`);
		if (source.topic) contentParts.push(`*${noteLabel(source)}*`, '');
		contentParts.push(
			...(points.length
				? points.map((point) => `- ${point}`)
				: [`- ${truncate(source.summary || source.content, 220)}`]),
			''
		);
	}

	if (options.ownNotes?.trim()) {
		const ownPoints = rankedSentences(options.ownNotes, level(options).summaryPoints, focus);
		contentParts.push('## From your attached notes');
		contentParts.push(
			...(ownPoints.length
				? ownPoints.map((point) => `- ${point}`)
				: [`- ${truncate(options.ownNotes, 240)}`]),
			''
		);
	}

	const allKeywords = extractKeywords(combinedText(sources, options), 10);
	contentParts.push(
		'## Terms to remember',
		'',
		allKeywords.map((keyword) => `\`${keyword.term}\``).join(' · '),
		'',
		'> Check these points against your class discussion. Community notes can be incomplete or out of date.'
	);

	return {
		title: `Summary: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status })),
			keywords: allKeywords.map((keyword) => ({ term: keyword.term, count: keyword.count, notes: sources.map((s) => s.title) }))
		}
	};
}

function buildReviewer(sources: StudySource[], options: StudyOptions): StudyResult {
	const focus = focusList(options);
	const contentParts: string[] = [
		'# Study reviewer',
		'',
		`A structured reviewer assembled from ${sources.length} community ${sources.length === 1 ? 'note' : 'notes'}. Answer the checks out loud before looking back at the source.`,
		''
	];

	sources.forEach((source, index) => {
		const points = rankedSentences(source.content, level(options).reviewerPoints, focus);
		contentParts.push(`## ${index + 1}. ${source.title}`);
		contentParts.push(
			`**Where it comes from:** ${noteLabel(source)} · ${source.status === 'verified' ? 'Community Verified' : 'Community Submitted'} · ${sentenceLink(source)}`,
			''
		);
		if (source.summary) contentParts.push(source.summary, '');
		contentParts.push('### Key points');
		contentParts.push(
			...(points.length
				? points.map((point) => `- ${point}`)
				: [`- ${truncate(source.content, 240)}`]),
			''
		);

		const keywords = (source.keywords?.length ? source.keywords : extractKeywords(source.content, 5).map((k) => k.term)).slice(0, 5);
		if (keywords.length) {
			contentParts.push('### Terms to define', '', keywords.map((term) => `- **${term}** — explain it without looking.`).join('\n'), '');
		}

		const checks = rankedSentences(source.content, level(options).checks, focus);
		if (checks.length) {
			contentParts.push('### Check yourself');
			contentParts.push(
				...checks.map((sentence, i) => `${i + 1}. ${sentence.replace(/[.!?]$/, '?')}`),
				''
			);
		}
	});

	if (options.ownNotes?.trim()) {
		contentParts.push('## Your attached notes');
		contentParts.push(
			...rankedSentences(options.ownNotes, 6, focus).map((point) => `- ${point}`),
			''
		);
	}

	contentParts.push(
		'## Before the exam',
		'',
		'- Close the reviewer and explain each heading in your own words.',
		'- Mark every term you could not define and revisit the matching source note.',
		'- Use the practice quiz to test recall, then review only the items you missed.',
		'',
		'> Generated study aid. It summarizes community material and may omit details your instructor expects.'
	);

	return {
		title: `Reviewer: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status })),
			keywords: extractKeywords(combinedText(sources, options), 12).map((keyword) => ({
				term: keyword.term,
				count: keyword.count,
				notes: sources.map((source) => source.title)
			}))
		}
	};
}

function seededShuffle<T>(items: T[], seed: number): T[] {
	const copy = [...items];
	let state = seed || 1;
	for (let i = copy.length - 1; i > 0; i--) {
		state = (state * 1664525 + 1013904223) % 4294967296;
		const j = state % (i + 1);
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

function hashSeed(text: string): number {
	let hash = 2166136261;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return Math.abs(hash);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildTrueFalse(
	sources: StudySource[],
	pool: string[],
	options: StudyOptions,
	limit: number,
	used: Set<string>
): QuizQuestion[] {
	if (limit <= 0) return [];
	const tier = level(options);
	const items: QuizQuestion[] = [];
	const candidates = sources.flatMap((source) =>
		splitSentences(source.content)
			.map((sentence, index) => ({ source, sentence, index }))
			.filter(
				(candidate) =>
					candidate.sentence.length >= Math.max(70, tier.minSentence) && candidate.sentence.length <= 320
			)
	);
	const ordered = seededShuffle(candidates, hashSeed(`tf|${options.focus ?? ''}|${options.questionCount ?? 8}`));

	for (const candidate of ordered) {
		if (items.length >= limit) break;
		const tokens = tokenize(candidate.sentence).filter((token) => pool.includes(token) && token.length >= 5);
		if (tokens.length === 0) continue;

		const answerTerm = tokens[0];
		const pattern = new RegExp(`\\b${escapeRegex(answerTerm)}\\b`, 'i');
		if (!pattern.test(candidate.sentence)) continue;

		const statementKey = candidate.sentence.slice(0, 50);
		if (used.has(statementKey)) continue;

		const replacements = pool.filter(
			(term) =>
				term.length >= 4 &&
				term !== answerTerm &&
				!candidate.sentence.toLowerCase().includes(term.toLowerCase())
		);
		const makeFalse = replacements.length > 0 && hashSeed(candidate.sentence) % 2 === 0;
		const replacement = makeFalse
			? replacements[hashSeed(candidate.sentence + answerTerm) % replacements.length]
			: null;
		const statement = replacement ? candidate.sentence.replace(pattern, replacement) : candidate.sentence;

		used.add(statementKey);
		items.push({
			id: '',
			type: 'tf',
			prompt: `True or false: “${truncate(statement, 320)}”`,
			options: ['True', 'False'],
			answer: replacement ? 1 : 0,
			explanation: replacement
				? `False. The source actually says: “${truncate(candidate.sentence, 300)}”`
				: `True. The source says: “${truncate(candidate.sentence, 300)}”`,
			sourceNoteId: candidate.source.id,
			sourceTitle: candidate.source.title
		});
	}

	return items;
}

function buildFlashcards(questions: QuizQuestion[], sources: StudySource[]): Flashcard[] {
	const cards: Flashcard[] = [];
	const seen = new Set<string>();

	for (const question of questions) {
		if (question.type === 'tf') continue;
		const front = question.options[question.answer];
		if (!front || seen.has(front.toLowerCase())) continue;
		const back = question.explanation.replace(/^The source says: “/, '').replace(/”$/, '');
		seen.add(front.toLowerCase());
		cards.push({
			id: `f${cards.length + 1}`,
			front,
			back,
			sourceNoteId: question.sourceNoteId,
			sourceTitle: question.sourceTitle
		});
	}

	if (cards.length >= 3) return cards;

	for (const source of sources) {
		const terms = (source.keywords?.length
			? source.keywords
			: extractKeywords(source.content, 6).map((keyword) => keyword.term)
		).slice(0, 4);
		for (const term of terms) {
			if (cards.length >= 12 || seen.has(term.toLowerCase())) continue;
			seen.add(term.toLowerCase());
			cards.push({
				id: `f${cards.length + 1}`,
				front: term,
				back: truncate(source.summary || source.content, 240),
				sourceNoteId: source.id,
				sourceTitle: source.title
			});
		}
	}

	return cards;
}

function buildQuiz(sources: StudySource[], options: StudyOptions): StudyResult {
	const requested = Math.min(15, Math.max(3, options.questionCount ?? 8));
	const focus = focusList(options);
	const tier = level(options);
	const difficulty = options.difficulty ?? 'standard';
	const tfTarget = requested >= 6 ? Math.max(1, Math.round(requested * 0.25)) : 0;
	const mcTarget = requested - tfTarget;
	const pool = extractKeywords(combinedText(sources, options), 40).map((item) => item.term);
	const questions: QuizQuestion[] = [];
	const used = new Set<string>();

	// Multiple-choice items are made by masking a key term in a source sentence.
	for (const source of sources) {
		const sentences = splitSentences(source.content);
		const candidates = sentences
			.map((sentence, index) => {
				const tokens = tokenize(sentence);
				const keywords = tokens.filter((token) => pool.includes(token) && token.length >= 5);
				const focusHits = focus.filter((term) => sentence.toLowerCase().includes(term.toLowerCase())).length;
				return { sentence, index, keywords, focusHits };
			})
			.filter((candidate) => candidate.keywords.length > 0 && candidate.sentence.length >= tier.minSentence)
			.sort((a, b) => b.focusHits - a.focusHits || a.index - b.index);

		for (const candidate of candidates) {
			if (questions.length >= mcTarget) break;
			const answerTerm = candidate.keywords[0];
			const key = `${candidate.sentence.slice(0, 40)}|${answerTerm}`;
			if (used.has(key)) continue;

			const pattern = new RegExp(`\\b${answerTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
			if (!pattern.test(candidate.sentence)) continue;

			const promptText = candidate.sentence.replace(pattern, '_____');
			if (promptText.includes('_____') === false) continue;

			const distractors = seededShuffle(
				pool.filter((term) => term !== answerTerm && !answerTerm.includes(term) && !term.includes(answerTerm) && term.length >= 4),
				hashSeed(answerTerm)
			).slice(0, 3);
			if (distractors.length < 3) continue;

			const optionTerms = seededShuffle([answerTerm, ...distractors], hashSeed(candidate.sentence));
			const answer = optionTerms.indexOf(answerTerm);
			used.add(key);
			questions.push({
				id: `q${questions.length + 1}`,
				type: 'mc',
				prompt: `Which term best completes this statement? “${truncate(promptText, 320)}”`,
				options: optionTerms.map((term) => term.replace(/\b\w/g, (c) => c.toUpperCase())),
				answer,
				explanation: `The source says: “${truncate(candidate.sentence, 300)}”`,
				sourceNoteId: source.id,
				sourceTitle: source.title
			});
			break;
		}
	}

	if (questions.length < mcTarget) {
		for (const source of sources) {
			const keywords = (source.keywords?.length ? source.keywords : extractKeywords(source.content, 6).map((k) => k.term)).slice(0, 4);
			const distractors = seededShuffle(pool.filter((term) => !keywords.includes(term)), hashSeed(source.title)).slice(0, 3);
			for (const term of keywords) {
				if (questions.length >= mcTarget || distractors.length < 3) break;
				const optionTerms = seededShuffle([term, ...distractors], hashSeed(source.title + term));
				questions.push({
					id: `q${questions.length + 1}`,
					type: 'mc',
					prompt: `Which term is most closely associated with “${source.title}”?`,
					options: optionTerms.map((value) => value.replace(/\b\w/g, (c) => c.toUpperCase())),
					answer: optionTerms.indexOf(term),
					explanation: `“${term}” is a key term in ${source.title}.`,
					sourceNoteId: source.id,
					sourceTitle: source.title
				});
			}
		}
	}

	questions.push(...buildTrueFalse(sources, pool, options, requested - questions.length, used));

	const ordered = seededShuffle(questions, hashSeed(`quiz|${difficulty}|${options.focus ?? ''}`)).map(
		(question, index) => ({ ...question, id: `q${index + 1}` })
	);
	const flashcards = buildFlashcards(ordered, sources);

	const contentParts = [
		'# Practice quiz',
		'',
		`${ordered.length} ${difficulty} questions generated from community notes. Choose one answer per item, then check the explanations.`,
		'',
		...ordered.map((question, index) => {
			const optionsList = question.options
				.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`)
				.join('\n');
			return `## ${index + 1}. ${question.prompt}\n\n${optionsList}\n\n<details>\n<summary>Show answer</summary>\n\n**Answer:** ${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}\n\n${question.explanation}${question.sourceNoteId ? ` [Read the source note](/notes/${question.sourceNoteId})` : ''}\n\n</details>\n`;
		}),
		'> Quiz items are machine-generated from community notes and may contain ambiguity. Use them for recall practice, not as an official exam key.'
	];

	return {
		title: `Practice quiz: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			questions: ordered,
			flashcards,
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status })),
			options: { questionCount: ordered.length, difficulty, trueFalse: ordered.filter((question) => question.type === 'tf').length }
		}
	};
}

function buildKeywords(sources: StudySource[], options: StudyOptions): StudyResult {
	const scores = extractKeywords(combinedText(sources, options), 30);
	const contentParts = [
		'# Keyword list',
		'',
		`Ranked terms from ${sources.length} community ${sources.length === 1 ? 'note' : 'notes'}. Write a one-line definition for each before checking the source.`,
		''
	];

	for (const keyword of scores) {
		const origin = sources.find((source) => `${source.content}`.toLowerCase().includes(keyword.term));
		contentParts.push(
			`## ${keyword.term}`,
			`- **Appears:** ${keyword.count}×`,
			`- **Source:** ${origin?.title ?? 'Combined notes'}`,
			'- **Your definition:** ________________________________',
			''
		);
	}

	contentParts.push(
		'## Study routine',
		'',
		'- Group the terms into 3–5 themes.',
		'- Explain each theme aloud without reading.',
		'- Turn each term into a question and answer it from memory.',
		'',
		'> Terms are ranked by frequency, not by exam importance.'
	);

	return {
		title: `Keywords: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			keywords: scores.map((score) => ({
				term: score.term,
				count: score.count,
				notes: sources.filter((source) => source.content.toLowerCase().includes(score.term)).map((source) => source.title)
			})),
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status }))
		}
	};
}

export function generateStudy(kind: StudyKind, sources: StudySource[], options: StudyOptions = {}): StudyResult {
	if (sources.length === 0) {
		throw new Error('Choose at least one community note before generating study material.');
	}
	switch (kind) {
		case 'summary':
			return buildSummary(sources, options);
		case 'reviewer':
			return buildReviewer(sources, options);
		case 'quiz':
			return buildQuiz(sources, options);
		case 'keywords':
			return buildKeywords(sources, options);
	}
}

export function studyToPlainText(content: string): string {
	return stripMarkdown(content).replace(/\s{2,}/g, ' ').trim();
}
