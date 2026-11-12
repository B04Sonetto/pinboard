import type {
	EssayPrompt,
	Flashcard,
	IdentificationQuestion,
	NoteStatus,
	QuizQuestion,
	StudyDifficulty,
	StudyKind,
	StudyPayload
} from '$lib/types';
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
	examTimeLimit?: number;
	examSections?: string[];
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

function noteIdFor(source: StudySource): string | null {
	return source.id === 'own-notes' ? null : source.id;
}

function sentenceLink(source: StudySource): string {
	return source.id === 'own-notes' ? 'Your attached notes' : `[Read the source note](/notes/${source.id})`;
}

function combinedText(sources: StudySource[], options: StudyOptions): string {
	return [
		...sources.map((source) => `${source.title}\n${source.summary ?? ''}\n${source.content}`),
		options.ownNotes ?? ''
	].join('\n\n');
}

function sourcesWithOwnNotes(sources: StudySource[], options: StudyOptions): StudySource[] {
	const ownNotes = options.ownNotes?.trim();
	return ownNotes
		? [
				...sources,
				{
					id: 'own-notes',
					title: 'Your attached notes',
					status: 'submitted',
					content: ownNotes
				}
			]
		: sources;
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

const GENERIC_TERMS = new Set([
	'chapter',
	'section',
	'lesson',
	'student',
	'students',
	'teacher',
	'teachers',
	'notes',
	'note',
	'summary',
	'discussion',
	'activity',
	'activities',
	'question',
	'questions',
	'answer',
	'answers',
	'page',
	'pages',
	'class',
	'classes',
	'course',
	'courses',
	'subject',
	'module',
	'modules',
	'important',
	'different',
	'following',
	'according',
	'given',
	'above',
	'below',
	'generally',
	'place',
	'places',
	'every',
	'part',
	'parts',
	'type',
	'types',
	'kind',
	'kinds',
	'number',
	'numbers',
	'thing',
	'things',
	'form',
	'either',
	'certain',
	'specific'
]);

const TERM_VERBS = new Set([
	'absorbed',
	'adds',
	'added',
	'adding',
	'allows',
	'allowed',
	'allowing',
	'applied',
	'based',
	'becomes',
	'becoming',
	'built',
	'calls',
	'called',
	'calling',
	'caused',
	'changes',
	'changed',
	'changing',
	'communicates',
	'communicating',
	'compared',
	'connects',
	'connected',
	'connecting',
	'considered',
	'consists',
	'consisting',
	'contains',
	'converted',
	'creating',
	'created',
	'creates',
	'decreases',
	'decreased',
	'decreasing',
	'defines',
	'defined',
	'defining',
	'deletes',
	'deleting',
	'describes',
	'described',
	'describing',
	'determined',
	'developed',
	'divided',
	'emitted',
	'ends',
	'ending',
	'fail',
	'fails',
	'fixed',
	'formed',
	'found',
	'gives',
	'given',
	'giving',
	'grouped',
	'happens',
	'happening',
	'helps',
	'helping',
	'holds',
	'holding',
	'identifies',
	'identified',
	'identifying',
	'includes',
	'increasing',
	'increases',
	'increased',
	'involves',
	'involving',
	'keeps',
	'keeping',
	'known',
	'listed',
	'made',
	'makes',
	'making',
	'means',
	'measured',
	'moves',
	'moving',
	'needed',
	'obtained',
	'occurs',
	'occurring',
	'organizes',
	'organizing',
	'performed',
	'points',
	'pointing',
	'produced',
	'provides',
	'providing',
	'references',
	'referencing',
	'refers',
	'released',
	'removes',
	'removed',
	'removing',
	'represents',
	'representing',
	'repeating',
	'requires',
	'required',
	'requiring',
	'retransmits',
	'retransmitting',
	'returns',
	'returning',
	'seen',
	'selects',
	'selecting',
	'sets',
	'setting',
	'shows',
	'shown',
	'showing',
	'speeds',
	'speeding',
	'starts',
	'starting',
	'stores',
	'stored',
	'storing',
	'succeed',
	'succeeds',
	'takes',
	'taken',
	'taking',
	'tested',
	'translates',
	'translating',
	'updates',
	'updating',
	'uses',
	'used',
	'works',
	'working',
	'written'
]);

/**
 * Noun phrases that end in -ing and read naturally as answers. Anything else
 * ending in -ed/-ing is a verb phrase and makes a poor fill-in-the-blank.
 */
const VERB_PHRASE_EXCEPTIONS = new Set([
	'active learning',
	'blended learning',
	'critical thinking',
	'deep learning',
	'design thinking',
	'distance learning',
	'machine learning'
]);

function isAnswerableTerm(term: string): boolean {
	const lower = term.toLowerCase();
	if (!isUsableTerm(lower)) return false;
	const words = lower.split(/\s+/);
	if (words.length === 1) return true;
	if (VERB_PHRASE_EXCEPTIONS.has(lower)) return true;
	return !/(?:ed|ing)$/i.test(words[words.length - 1]);
}

function isUsableTerm(term: string): boolean {
	const words = term.split(/\s+/);
	if (words.some((word) => TERM_VERBS.has(word))) return false;
	return true;
}

/** Single-word modifiers such as "normal" or "atomic" read badly as answer choices. */
function looksLikeModifier(term: string): boolean {
	const words = term.split(/\s+/);
	return words.length === 1 && /(?:al|ive|ic|ous|ary|able|ible|less|ful)$/i.test(term);
}

/** Distinct, human-readable key terms in frequency order. */
function keyTermsFor(text: string, limit = 60): string[] {
	const terms = extractKeywords(text, Math.min(limit * 2, 160))
		.map((item) => item.term.trim().toLowerCase())
		.filter((term) => term.length >= 3 && term.length <= 44)
		.filter((term) => !/^\d+$/.test(term))
		.filter((term) => !GENERIC_TERMS.has(term))
		.filter(isAnswerableTerm)
		.filter((term, index, all) => all.indexOf(term) === index);
	return terms.slice(0, limit);
}

function termPattern(term: string): RegExp {
	return new RegExp(`\\b${escapeRegex(term).replace(/\s+/g, '\\s+')}\\b`, 'i');
}

function displayTerm(term: string): string {
	return term.replace(/\b[a-z]/g, (character) => character.toUpperCase());
}

function sharesWord(a: string, b: string): boolean {
	const words = new Set(tokenize(a));
	return tokenize(b).some((word) => words.has(word));
}

function sourceSentences(source: StudySource): string[] {
	return splitSentences([source.summary, source.content].filter(Boolean).join('\n'));
}

const DEFINITION_PATTERN = new RegExp(
	'^(?:(?:the|a|an)\\s+)?(.{3,60}?)\\s+' +
		'(?:is\\s+defined\\s+as|are\\s+defined\\s+as|can\\s+be\\s+defined\\s+as|refers\\s+to|refer\\s+to|is\\s+called|are\\s+called|consists\\s+of|involves|describes|represents|means|is|are)\\s+' +
		'(.{20,300})$',
	'i'
);

const PRONOUN_SUBJECT = /^(?:this|these|those|it|they|there|such|each|every|which|that|one|some|many|both|all|he|she|we|you|i)\b/i;

/** Return a clean definition subject (the answer) or null when it is not usable. */
function cleanSubject(value: string): string | null {
	const subject = value
		.replace(/^[\s"'“”]+|[\s"'“”]+$/g, '')
		.replace(/^(?:the|a|an)\s+/i, '')
		.replace(/[,;:]+$/, '')
		.trim();
	if (subject.length < 3 || subject.length > 48) return null;
	const words = subject.split(/\s+/);
	if (words.length < 1 || words.length > 6) return null;
	if (!/^[A-Za-z0-9][A-Za-z0-9\s'’.-]*$/.test(subject)) return null;
	if (PRONOUN_SUBJECT.test(subject) || GENERIC_TERMS.has(subject.toLowerCase())) return null;
	return subject;
}

interface ChoicePlan {
	source: StudySource;
	sentence: string;
	answer: string;
	prompt: string;
	explanation: string;
	kind: 'definition' | 'cloze';
}

function definitionPlans(source: StudySource): ChoicePlan[] {
	const plans: ChoicePlan[] = [];
	const seen = new Set<string>();
	for (const sentence of sourceSentences(source)) {
		const match = sentence.match(DEFINITION_PATTERN);
		if (!match) continue;
		const subject = cleanSubject(match[1]);
		if (!subject) continue;
		const definition = match[2].replace(/\s+/g, ' ').trim();
		if (definition.length < 20) continue;
		const key = subject.toLowerCase();
		if (seen.has(key) || definition.toLowerCase().includes(key)) continue;
		seen.add(key);
		plans.push({
			source,
			sentence,
			answer: subject,
			prompt: `Which term matches this description? “${truncate(definition, 260)}”`,
			explanation: `The source says: “${truncate(sentence, 300)}”`,
			kind: 'definition'
		});
	}
	return plans;
}

function clozePlans(source: StudySource, pool: string[], minSentence = 60): ChoicePlan[] {
	const plans: ChoicePlan[] = [];
	const sentences = sourceSentences(source).filter((sentence) => sentence.length >= minSentence);
	const seen = new Set<string>();
	const orderedTerms = [...pool].sort(
		(a, b) => b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length
	);
	for (const term of orderedTerms) {
		if (term.length < 3) continue;
		const pattern = termPattern(term);
		const sentence = sentences.find((candidate) => pattern.test(candidate));
		if (!sentence) continue;
		const match = sentence.match(pattern);
		if (!match) continue;
		const answer = match[0];
		const key = answer.toLowerCase();
		if (seen.has(key)) continue;
		const promptText = sentence.replace(pattern, '_____');
		if (!promptText.includes('_____')) continue;
		seen.add(key);
		plans.push({
			source,
			sentence,
			answer,
			prompt: `Fill in the missing term: “${truncate(promptText, 300)}”`,
			explanation: `The source says: “${truncate(sentence, 300)}”`,
			kind: 'cloze'
		});
	}
	return plans;
}

function pickDistractors(answer: string, sentence: string, pool: string[], seed: number): string[] {
	const answerWords = Math.max(1, new Set(tokenize(answer)).size);
	const candidates = pool.filter((term) => {
		if (term.toLowerCase() === answer.toLowerCase()) return false;
		if (term.length < 3 || term.length > 44) return false;
		if (looksLikeModifier(term)) return false;
		if (sentence.toLowerCase().includes(term.toLowerCase())) return false;
		return !sharesWord(term, answer);
	});

	return seededShuffle(candidates, seed)
		.sort((a, b) => {
			const shapeA =
				Math.abs(a.split(' ').length - answerWords) + Math.abs(a.length - answer.length) / 24;
			const shapeB =
				Math.abs(b.split(' ').length - answerWords) + Math.abs(b.length - answer.length) / 24;
			return shapeA - shapeB;
		})
		.slice(0, 3)
		.map(displayTerm);
}

function buildMultipleChoice(
	sources: StudySource[],
	pool: string[],
	options: StudyOptions,
	limit: number,
	usedAnswers: Set<string>,
	usedPrompts: Set<string>
): QuizQuestion[] {
	if (limit <= 0) return [];
	const tier = level(options);
	const focus = focusList(options);
	const questions: QuizQuestion[] = [];
	const queues = sources.map((source) => {
		const definitions = definitionPlans(source);
		const cloze = clozePlans(source, pool, Math.max(60, tier.minSentence));
		const plans = [...definitions, ...cloze];
		const focusScore = (plan: ChoicePlan) =>
			focus.filter((term) => plan.prompt.toLowerCase().includes(term.toLowerCase())).length;
		return plans.sort(
			(a, b) =>
				focusScore(b) - focusScore(a) ||
				(a.kind === 'definition' ? 0 : 1) - (b.kind === 'definition' ? 0 : 1)
		);
	});
	const usedSentences = new Set<string>();
	let allowSentenceReuse = false;

	while (questions.length < limit) {
		let progressed = false;

		for (const queue of queues) {
			if (questions.length >= limit) break;
			const index = queue.findIndex(
				(candidate) =>
					!usedAnswers.has(candidate.answer.toLowerCase()) &&
					!usedPrompts.has(candidate.prompt.toLowerCase()) &&
					(allowSentenceReuse || !usedSentences.has(candidate.sentence.toLowerCase()))
			);
			if (index < 0) continue;
			const plan = queue.splice(index, 1)[0];

			const distractors = pickDistractors(
				plan.answer,
				plan.sentence,
				pool,
				hashSeed(plan.prompt)
			);
			if (distractors.length === 0) continue;

			const answerDisplay = displayTerm(plan.answer);
			const uniqueOptions = [answerDisplay];
			for (const distractor of distractors) {
				if (uniqueOptions.some((option) => option.toLowerCase() === distractor.toLowerCase())) continue;
				uniqueOptions.push(distractor);
				if (uniqueOptions.length >= 4) break;
			}
			if (uniqueOptions.length < 2) continue;

			const shuffledOptions = seededShuffle(uniqueOptions, hashSeed(`${plan.prompt}|${plan.answer}`));
			const answerIndex = shuffledOptions.findIndex(
				(option) => option.toLowerCase() === answerDisplay.toLowerCase()
			);
			if (answerIndex < 0) continue;

			usedAnswers.add(plan.answer.toLowerCase());
			usedPrompts.add(plan.prompt.toLowerCase());
			usedSentences.add(plan.sentence.toLowerCase());
			progressed = true;
			questions.push({
				id: `q${questions.length + 1}`,
				type: 'mc',
				prompt: plan.prompt,
				options: shuffledOptions,
				answer: answerIndex,
				explanation: plan.explanation,
				sourceNoteId: noteIdFor(plan.source),
				sourceTitle: plan.source.title
			});
		}

		if (questions.length >= limit) break;
		if (!progressed) {
			// Every usable definition was already covered. Allow a second pass
			// over the same sentences before giving up on the requested count.
			if (allowSentenceReuse) break;
			allowSentenceReuse = true;
		}
	}

	return questions;
}

function negateStatement(sentence: string): string | null {
	if (/\b(?:not|cannot)\b|n't\b/i.test(sentence)) return null;
	const swaps: [RegExp, string][] = [
		[/\bcan\b/i, 'cannot'],
		[/\bwill\b/i, 'will not'],
		[/\bmust\b/i, 'must not'],
		[/\bare\b/i, 'are not'],
		[/\bis\b/i, 'is not'],
		[/\balways\b/i, 'never'],
		[/\bincludes\b/i, 'excludes'],
		[/\bincreases\b/i, 'decreases'],
		[/\ballows\b/i, 'prevents'],
		[/\bbefore\b/i, 'after'],
		[/\bafter\b/i, 'before'],
		[/\bmaximum\b/i, 'minimum'],
		[/\bminimum\b/i, 'maximum'],
		[/\bpositive\b/i, 'negative'],
		[/\bnegative\b/i, 'positive'],
		[/\bhigher\b/i, 'lower'],
		[/\blower\b/i, 'higher'],
		[/\bmore\b/i, 'less'],
		[/\bless\b/i, 'more'],
		[/\bvertical\b/i, 'horizontal'],
		[/\bhorizontal\b/i, 'vertical'],
		[/\bclockwise\b/i, 'counterclockwise'],
		[/\bprimary\b/i, 'secondary'],
		[/\bsecondary\b/i, 'primary'],
		[/\ball\b/i, 'no'],
		[/\bevery\b/i, 'no']
	];
	for (const [pattern, replacement] of swaps) {
		if (replacement === 'must not' && /\beither\b/i.test(sentence)) continue;
		if (!pattern.test(sentence)) continue;
		const next = sentence.replace(pattern, replacement);
		if (next !== sentence) return next;
	}
	return null;
}

function buildTrueFalse(
	sources: StudySource[],
	options: StudyOptions,
	limit: number,
	used: Set<string>
): QuizQuestion[] {
	if (limit <= 0) return [];
	const tier = level(options);
	const items: QuizQuestion[] = [];
	const queues = sources.map((source) =>
		seededShuffle(
			sourceSentences(source)
				.filter(
					(sentence) => sentence.length >= Math.max(70, tier.minSentence) && sentence.length <= 320
				)
				.map((sentence) => ({ source, sentence })),
			hashSeed(`tf|${source.id}|${options.focus ?? ''}|${options.questionCount ?? 8}`)
		)
	);

	while (items.length < limit) {
		const before = items.length;
		for (const queue of queues) {
			if (items.length >= limit) break;
			const candidate = queue.shift();
			if (!candidate) continue;
			const { source, sentence } = candidate;

			const statementKey = sentence.toLowerCase().replace(/\s+/g, ' ').slice(0, 100);
			if (used.has(statementKey)) continue;

			const negated = negateStatement(sentence);
			const statement = negated ?? sentence;
			const isFalse = Boolean(negated);

			used.add(statementKey);
			items.push({
				id: '',
				type: 'tf',
				prompt: `True or false: “${truncate(statement, 320)}”`,
				options: ['True', 'False'],
				answer: isFalse ? 1 : 0,
				explanation: isFalse
					? `False. The source actually says: “${truncate(sentence, 300)}”`
					: `True. The source says: “${truncate(sentence, 300)}”`,
				sourceNoteId: noteIdFor(source),
				sourceTitle: source.title
			});
		}
		if (items.length === before) break;
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
				sourceNoteId: noteIdFor(source),
				sourceTitle: source.title
			});
		}
	}

	return cards;
}

function buildQuiz(
	sources: StudySource[],
	options: StudyOptions,
	includeIdentification = true
): StudyResult {
	const requested = Math.min(15, Math.max(3, Math.round(options.questionCount ?? 8)));
	const difficulty = options.difficulty ?? 'standard';
	const tfTarget = requested >= 6 ? Math.max(1, Math.round(requested * 0.25)) : 0;
	const mcTarget = requested - tfTarget;
	const quizSources = sourcesWithOwnNotes(sources, options);
	const corpus = quizSources
		.map((source) => [source.summary, source.content].filter(Boolean).join('\n'))
		.join('\n\n');
	const pool = keyTermsFor(corpus, 90);
	const communitySourceCount = sources.filter((source) => source.id !== 'own-notes').length;
	const includesOwnNotes = quizSources.some((source) => source.id === 'own-notes');
	const sourceDescription = communitySourceCount
		? `${communitySourceCount} selected community ${communitySourceCount === 1 ? 'note' : 'notes'}${includesOwnNotes ? ' and your attached notes' : ''}`
		: 'your attached notes';

	const usedAnswers = new Set<string>();
	const usedPrompts = new Set<string>();
	const usedStatements = new Set<string>();
	const questions = buildMultipleChoice(
		quizSources,
		pool,
		options,
		mcTarget,
		usedAnswers,
		usedPrompts
	);

	questions.push(
		...buildTrueFalse(quizSources, options, requested - questions.length, usedStatements)
	);

	const ordered = seededShuffle(questions, hashSeed(`quiz|${difficulty}|${options.focus ?? ''}`)).map(
		(question, index) => ({ ...question, id: `q${index + 1}` })
	);
	const identification = includeIdentification
		? buildIdentification(
				quizSources,
				{ ...options, ownNotes: '' },
				Math.max(2, Math.min(5, Math.round(requested / 4)))
			)
		: [];
	const numberedIdentification = identification.map((question, index) => ({
		...question,
		id: `i${index + 1}`
	}));
	const flashcards = buildFlashcards(ordered, quizSources);

	const contentParts = [
		'# Practice quiz',
		'',
		`${ordered.length + numberedIdentification.length} ${difficulty} questions generated from ${sourceDescription}. Choose one answer or write the missing term, then check the explanations.`,
		'',
		...ordered.map((question, index) => {
			const optionsList = question.options
				.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`)
				.join('\n');
			return `## ${index + 1}. ${question.prompt}\n\n${optionsList}\n\n**Answer:** ${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}\n\n${question.explanation}${question.sourceNoteId ? ` [Read the source note](/notes/${question.sourceNoteId})` : ''}\n\n`;
		}),
		...(numberedIdentification.length
			? [
					'## Identification',
					'',
					...numberedIdentification.map(
						(question, index) =>
							`### ${index + 1}. ${question.prompt}\n\n**Answer:** ${question.answer}\n\n${question.explanation}${question.sourceNoteId ? ` [Read the source note](/notes/${question.sourceNoteId})` : ''}\n\n`
					)
				]
			: []),
		'> Quiz items are machine-generated from community notes and may contain ambiguity. Use them for recall practice, not as an official exam key.'
	];

	return {
		title: `Practice quiz: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			questions: ordered,
			identification: numberedIdentification,
			flashcards,
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status })),
			options: {
				questionCount: ordered.length + numberedIdentification.length,
				difficulty,
				trueFalse: ordered.filter((question) => question.type === 'tf').length,
				identificationCount: numberedIdentification.length
			}
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

const EXAM_SECTIONS = ['multiple_choice', 'true_false', 'identification', 'essay'] as const;

function resolveExamSections(options: StudyOptions): string[] {
	const requested = options.examSections?.filter((section) =>
		(EXAM_SECTIONS as readonly string[]).includes(section)
	);
	const sections = requested?.length ? [...new Set(requested)] : [...EXAM_SECTIONS];
	if (!sections.includes('multiple_choice')) sections.unshift('multiple_choice');
	return sections;
}

interface IdentificationPlan {
	source: StudySource;
	sentence: string;
	answer: string;
	prompt: string;
}

function buildIdentification(
	sources: StudySource[],
	options: StudyOptions,
	limit: number
): IdentificationQuestion[] {
	const items: IdentificationQuestion[] = [];
	if (limit <= 0) return items;
	const pool = keyTermsFor(combinedText(sources, options), 60);
	const usedAnswers = new Set<string>();
	const usedPrompts = new Set<string>();

	const queues = sources.map((source): IdentificationPlan[] => {
		const plans: IdentificationPlan[] = [];
		const sentences = sourceSentences(source);

		for (const sentence of sentences) {
			const match = sentence.match(DEFINITION_PATTERN);
			if (!match) continue;
			const subject = cleanSubject(match[1]);
			if (!subject) continue;
			const pattern = termPattern(subject);
			if (!pattern.test(sentence)) continue;
			const promptText = sentence.replace(pattern, '_____');
			if (!promptText.includes('_____')) continue;
			plans.push({
				source,
				sentence,
				answer: subject,
				prompt: `Identify the term that completes this definition: “${truncate(promptText, 300)}”`
			});
		}

		const terms = source.keywords?.length ? source.keywords : pool;
		for (const term of terms) {
			if (!term || term.length < 3) continue;
			const pattern = termPattern(term);
			const sentence = sentences.find((candidate) => pattern.test(candidate));
			if (!sentence) continue;
			const match = sentence.match(pattern);
			if (!match) continue;
			const promptText = sentence.replace(pattern, '_____');
			if (!promptText.includes('_____')) continue;
			plans.push({
				source,
				sentence,
				answer: match[0],
				prompt: `Identify the missing term: “${truncate(promptText, 300)}”`
			});
		}

		return plans;
	});

	while (items.length < limit) {
		const before = items.length;
		for (const queue of queues) {
			if (items.length >= limit) break;
			let plan: IdentificationPlan | undefined;
			while (queue.length) {
				const candidate = queue.shift()!;
				if (!candidate.answer) continue;
				if (usedAnswers.has(candidate.answer.toLowerCase())) continue;
				if (usedPrompts.has(candidate.prompt.toLowerCase())) continue;
				plan = candidate;
				break;
			}
			if (!plan) continue;

			usedAnswers.add(plan.answer.toLowerCase());
			usedPrompts.add(plan.prompt.toLowerCase());
			items.push({
				id: `i${items.length + 1}`,
				prompt: plan.prompt,
				answer: plan.answer,
				explanation: `The source says: “${truncate(plan.sentence, 300)}”`,
				sourceNoteId: noteIdFor(plan.source),
				sourceTitle: plan.source.title
			});
		}
		if (items.length === before) break;
	}

	return items;
}

function buildEssays(sources: StudySource[], options: StudyOptions): EssayPrompt[] {
	const focus = focusList(options);
	return sources.slice(0, 3).map((source, index) => {
		const terms = (source.keywords?.length
			? source.keywords
			: extractKeywords(source.content, 8).map((keyword) => keyword.term)
		)
			.map((term) => term.trim())
			.filter((term) => term.length >= 3)
			.filter((term) => !GENERIC_TERMS.has(term.toLowerCase()) && isUsableTerm(term.toLowerCase()))
			.filter((term, position, all) => all.indexOf(term) === position)
			.sort(
				(a, b) =>
					b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length
			)
			.slice(0, 4);
		const [first, second] = terms;

		const prompts = [
			first && second
				? `Explain how “${first}” and “${second}” connect in “${source.title}”. Define both terms, then describe the relationship in your own words.`
				: `Explain the main argument of “${source.title}” and identify the two most important terms a reader must understand.`,
			first && second
				? `Compare “${first}” and “${second}” from “${source.title}”. Where do they overlap, and what makes them different?`
				: `Summarize “${source.title}” in three sentences, then explain why the topic matters for the course.`,
			first
				? `A classmate claims that “${first}” is only a definition to memorize. Use ideas from “${source.title}” to explain how it is applied or why that claim is incomplete.`
				: `Describe a real situation where the ideas in “${source.title}” would matter, and explain what someone should do in that situation.`
		];

		return {
			id: `e${index + 1}`,
			prompt: prompts[index % prompts.length],
			guidance: source.summary
				? `Use the source summary as a starting point: ${truncate(source.summary, 220)}`
				: `Support your answer with at least two details from the source note${focus.length ? `, especially anything related to ${focus.slice(0, 2).join(' and ')}` : ''}.`,
			sourceNoteId: noteIdFor(source),
			sourceTitle: source.title
		};
	});
}

function buildExam(sources: StudySource[], options: StudyOptions): StudyResult {
	const sections = resolveExamSections(options);
	const examSources = sourcesWithOwnNotes(sources, options);
	const examOptions = { ...options, ownNotes: '' };
	const objective = buildQuiz(examSources, examOptions, false);
	const allQuestions = objective.payload.questions ?? [];
	const includeTrueFalse = sections.includes('true_false');
	const questions = allQuestions.filter((question) => includeTrueFalse || question.type !== 'tf');
	const identification = sections.includes('identification')
		? buildIdentification(
				examSources,
				examOptions,
				Math.max(2, Math.min(8, Math.round((options.questionCount ?? 10) / 3)))
			)
		: [];
	const essays = sections.includes('essay') ? buildEssays(examSources, examOptions) : [];
	const requestedTime = Number(options.examTimeLimit ?? 45);
	const timeLimitMinutes = Number.isFinite(requestedTime)
		? Math.min(180, Math.max(5, Math.round(requestedTime)))
		: 45;

	const actualSections = [
		...(questions.length ? ['multiple_choice', ...(questions.some((question) => question.type === 'tf') ? ['true_false'] : [])] : []),
		...(identification.length ? ['identification'] : []),
		...(essays.length ? ['essay'] : [])
	];

	const contentParts: string[] = [
		'# Practice exam',
		'',
		`**Time limit:** ${timeLimitMinutes} minutes · **Objective items:** ${questions.length + identification.length} · **Essay prompts:** ${essays.length}`,
		'',
		'Answer every section. The answer key is checked when you submit the interactive exam.',
		'',
		'## Part I — Objective questions'
	];

	if (questions.length) {
		questions.forEach((question, index) => {
			const optionsList = question.options
				.map((option, optionIndex) => `${String.fromCharCode(65 + optionIndex)}. ${option}`)
				.join('\n');
			contentParts.push(`### ${index + 1}. ${question.prompt}`, '', optionsList, '');
		});
	} else {
		contentParts.push('_No objective questions could be generated from these notes._', '');
	}

	if (identification.length) {
		contentParts.push('## Part II — Identification', '');
		identification.forEach((question, index) => {
			contentParts.push(`### ${index + 1}. ${question.prompt}`, '', 'Answer: ______________________________', '');
		});
	}

	if (essays.length) {
		contentParts.push('## Part III — Essay', '');
		essays.forEach((essay, index) => {
			contentParts.push(`### ${index + 1}. ${essay.prompt}`, '', `_${essay.guidance}_`, '', 'Answer:', '');
		});
	}

	contentParts.push(
		'---',
		'',
		'> This is a machine-generated practice exam from community notes. Essay answers are not automatically scored. Check your work against the source notes and your instructor\'s discussion.'
	);

	return {
		title: `Practice exam: ${sources[0]?.title ?? 'Study notes'}`,
		content: contentParts.join('\n'),
		payload: {
			engine: ENGINE,
			questions,
			identification,
			essays,
			exam: { timeLimitMinutes, sections: actualSections },
			sources: sources.map((source) => ({ id: source.id, title: source.title, status: source.status })),
			options: {
				questionCount: questions.length,
				identificationCount: identification.length,
				essayCount: essays.length,
				difficulty: options.difficulty ?? 'standard',
				examTimeLimit: timeLimitMinutes,
				examSections: actualSections
			}
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
			{
				const result = buildQuiz(sources, options);
				if (!result.payload.questions?.length) {
					throw new Error('These notes do not contain enough distinct, sentence-level information to build a quiz. Choose more detailed notes or add your own context.');
				}
				return result;
			}
		case 'exam':
			return buildExam(sources, options);
		case 'keywords':
			return buildKeywords(sources, options);
	}
}

export function studyToPlainText(content: string): string {
	return stripMarkdown(content).replace(/\s{2,}/g, ' ').trim();
}
