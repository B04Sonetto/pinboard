const STOPWORDS = new Set([
	'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an', 'and', 'any',
	'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both',
	'but', 'by', 'can', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each',
	'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
	'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
	'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on',
	'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she',
	'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
	'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until',
	'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom',
	'why', 'will', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves', 'use', 'used',
	'using', 'one', 'two', 'three', 'first', 'second', 'third', 'may', 'might', 'must', 'shall',
	'like', 'make', 'makes', 'made', 'many', 'much', 'need', 'needs', 'way', 'ways', 'example',
	'examples', 'within', 'without', 'upon', 'across', 'however', 'therefore', 'thus', 'yet',
	'per', 'via', 'etc', 'ie', 'eg', 'let', 'lets', 'get', 'gets', 'got', 'see', 'seen', 'shown',
	'show', 'shows', 'include', 'includes', 'including', 'based', 'able', 'well', 'often', 'usually'
]);

function normalizeToken(token: string): string {
	return token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '').toLowerCase();
}

export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/[^a-z0-9\s'-]/g, ' ')
		.split(/\s+/)
		.map(normalizeToken)
		.filter((token) => token.length >= 3 && token.length <= 32 && !STOPWORDS.has(token) && !/^\d+$/.test(token));
}

export interface KeywordScore {
	term: string;
	count: number;
}

/** Frequency-ranked keywords with simple bigram detection. */
export function extractKeywords(text: string | null | undefined, limit = 18): KeywordScore[] {
	if (!text) return [];
	const tokens = tokenize(text);
	const singles = new Map<string, number>();
	for (const token of tokens) {
		singles.set(token, (singles.get(token) ?? 0) + 1);
	}

	const bigrams = new Map<string, number>();
	for (let i = 0; i < tokens.length - 1; i++) {
		const a = tokens[i];
		const b = tokens[i + 1];
		if (a.length < 4 || b.length < 4) continue;
		const phrase = `${a} ${b}`;
		bigrams.set(phrase, (bigrams.get(phrase) ?? 0) + 1);
	}

	const scored: KeywordScore[] = [];
	for (const [term, count] of singles) {
		if (count < 1) continue;
		const boost = term.length >= 7 ? 1.25 : 1;
		scored.push({ term, count: count * boost });
	}
	for (const [term, count] of bigrams) {
		if (count >= 2) scored.push({ term, count: count * 2.2 });
	}

	const seen = new Set<string>();
	return scored
		.sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
		.filter(({ term }) => {
			if (seen.has(term)) return false;
			seen.add(term);
			return true;
		})
		.slice(0, limit)
		.map(({ term, count }) => ({ term, count: Math.round(count) }));
}

export function keywordTerms(text: string, limit = 12): string[] {
	return extractKeywords(text, limit).map((k) => k.term);
}

export function titleCase(value: string): string {
	return value.replace(/\b\w/g, (character) => character.toUpperCase());
}
