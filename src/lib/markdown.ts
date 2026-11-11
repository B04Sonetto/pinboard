/**
 * A deliberately small, dependency-free Markdown renderer.
 *
 * User-generated notes and AI output are untrusted, so every character is
 * HTML-escaped *before* any markup is applied. Links are restricted to
 * http(s), mailto and same-origin paths. No raw HTML passthrough.
 */

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function safeHref(raw: string): string | null {
	const href = raw.trim();
	if (/^https?:\/\//i.test(href)) return href;
	if (/^mailto:/i.test(href)) return href;
	if (href.startsWith('/') && !href.startsWith('//')) return href;
	if (href.startsWith('#')) return href;
	return null;
}

function inline(text: string): string {
	// Pull inline code out first so its contents are not transformed.
	const codes: string[] = [];
	let out = text.replace(/`([^`]+)`/g, (_, code: string) => {
		const token = `\u0000CODE${codes.length}\u0000`;
		codes.push(`<code>${code}</code>`);
		return token;
	});

	out = out
		.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, (match, label: string, raw: string) => {
			const href = safeHref(raw.replace(/&amp;/g, '&'));
			if (!href) return label;
			return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
		})
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
		.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>')
		.replace(/~~([^~]+)~~/g, '<del>$1</del>')
		.replace(/==([^=]+)==/g, '<mark>$1</mark>');

	codes.forEach((code, i) => {
		out = out.replace(`\u0000CODE${i}\u0000`, code);
	});
	return out;
}

function isFence(line: string) {
	return /^\s*```/.test(line);
}

export function renderMarkdown(markdown: string | null | undefined): string {
	if (!markdown) return '';
	const source = markdown.replace(/\r\n?/g, '\n');
	const lines = source.split('\n');
	const html: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (!line.trim()) {
			i++;
			continue;
		}

		// Fenced code
		if (isFence(line)) {
			const lang = line.replace(/^\s*```/, '').trim();
			i++;
			const code: string[] = [];
			while (i < lines.length && !isFence(lines[i])) {
				code.push(lines[i]);
				i++;
			}
			i++; // closing fence
			html.push(
				`<pre${lang ? ` data-lang="${escapeHtml(lang)}"` : ''}><code>${escapeHtml(code.join('\n'))}</code></pre>`
			);
			continue;
		}

		// Headings
		const heading = line.match(/^(#{1,4})\s+(.*)$/);
		if (heading) {
			const level = heading[1].length;
			html.push(`<h${level}>${inline(escapeHtml(heading[2]))}</h${level}>`);
			i++;
			continue;
		}

		// Horizontal rule
		if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
			html.push('<hr />');
			i++;
			continue;
		}

		// Blockquote
		if (/^\s*>\s?/.test(line)) {
			const quote: string[] = [];
			while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
				quote.push(lines[i].replace(/^\s*>\s?/, ''));
				i++;
			}
			html.push(`<blockquote>${inline(escapeHtml(quote.join(' ')))}</blockquote>`);
			continue;
		}

		// Table
		if (line.includes('|') && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1])) {
			const header = line
				.split('|')
				.map((cell) => cell.trim())
				.filter((cell, idx, arr) => !(cell === '' && (idx === 0 || idx === arr.length - 1)));
			i += 2;
			const rows: string[][] = [];
			while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
				const row = lines[i]
					.split('|')
					.map((cell) => cell.trim())
					.filter((cell, idx, arr) => !(cell === '' && (idx === 0 || idx === arr.length - 1)));
				rows.push(row);
				i++;
			}
			html.push(
				`<table><thead><tr>${header
					.map((cell) => `<th>${inline(escapeHtml(cell))}</th>`)
					.join('')}</tr></thead><tbody>${rows
					.map(
						(row) =>
							`<tr>${row.map((cell) => `<td>${inline(escapeHtml(cell))}</td>`).join('')}</tr>`
					)
					.join('')}</tbody></table>`
			);
			continue;
		}

		// Task list
		if (/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*+]\s+\[[ xX]\]\s+/.test(lines[i])) {
				const done = /\[[xX]\]/.test(lines[i]);
				const text = lines[i].replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, '');
				items.push(
					`<li class="task ${done ? 'is-done' : ''}"><span class="task-box" aria-hidden="true">${done ? '✓' : ''}</span> ${inline(escapeHtml(text))}</li>`
				);
				i++;
			}
			html.push(`<ul class="task-list">${items.join('')}</ul>`);
			continue;
		}

		// Unordered list
		if (/^\s*[-*+]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
				items.push(`<li>${inline(escapeHtml(lines[i].replace(/^\s*[-*+]\s+/, '')))}</li>`);
				i++;
			}
			html.push(`<ul>${items.join('')}</ul>`);
			continue;
		}

		// Ordered list
		if (/^\s*\d+[.)]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
				items.push(`<li>${inline(escapeHtml(lines[i].replace(/^\s*\d+[.)]\s+/, '')))}</li>`);
				i++;
			}
			html.push(`<ol>${items.join('')}</ol>`);
			continue;
		}

		// Paragraph
		const paragraph: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() &&
			!isFence(lines[i]) &&
			!/^(#{1,4})\s+/.test(lines[i]) &&
			!/^\s*[-*+]\s+/.test(lines[i]) &&
			!/^\s*\d+[.)]\s+/.test(lines[i]) &&
			!/^\s*>\s?/.test(lines[i]) &&
			!/^\s*([-*_])\1{2,}\s*$/.test(lines[i])
		) {
			paragraph.push(lines[i]);
			i++;
		}
		html.push(`<p>${inline(escapeHtml(paragraph.join(' ')))}</p>`);
	}

	return html.join('\n');
}
