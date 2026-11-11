import { extractKeywords } from '$lib/keywords';
import { Buffer } from 'node:buffer';

export const MAX_FILE_BYTES = 15 * 1024 * 1024;

export interface ExtractedFile {
	text: string;
	title: string;
	words: number;
	keywords: string[];
	fileType: string;
}

const TEXT_EXTENSIONS = ['txt', 'md', 'markdown', 'csv'];

export function extensionOf(name: string): string {
	const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
	return match?.[1] ?? '';
}

export function isSupportedFile(name: string): boolean {
	return ['pdf', 'docx', 'doc', ...TEXT_EXTENSIONS].includes(extensionOf(name));
}

function cleanExtractedText(text: string): string {
	return text
		.replace(/\r\n?/g, '\n')
		.replace(/\u0000/g, '')
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{4,}/g, '\n\n\n')
		.trim();
}

function titleFromText(text: string, fallback: string): string {
	const firstLine = text
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line.length >= 4 && line.length <= 160);
	if (firstLine) {
		return firstLine.replace(/^#+\s*/, '').replace(/\s+/g, ' ').slice(0, 160);
	}
	return fallback.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim().slice(0, 160) || 'Untitled notes';
}

export async function extractFile(file: File): Promise<ExtractedFile> {
	if (file.size === 0) throw new Error('That file is empty.');
	if (file.size > MAX_FILE_BYTES) throw new Error('Files must be 15 MB or smaller.');

	const extension = extensionOf(file.name);
	if (!isSupportedFile(file.name)) {
		throw new Error('Upload a PDF, DOCX, TXT or Markdown file.');
	}

	const buffer = new Uint8Array(await file.arrayBuffer());
	let text = '';

	if (extension === 'pdf') {
		// Magic bytes check for PDF: %PDF (0x25, 0x50, 0x44, 0x46)
		if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
			throw new Error('This file does not appear to be a valid PDF document (magic bytes mismatch).');
		}
		const { extractText } = await import('unpdf');
		const result = await extractText(buffer, { mergePages: true });
		text = Array.isArray(result.text) ? result.text.join('\n\n') : result.text;
	} else if (extension === 'docx' || extension === 'doc') {
		if (extension === 'doc') {
			throw new Error('Legacy .doc files are not supported. Save the document as .docx or PDF and try again.');
		}
		// Magic bytes check for DOCX (ZIP archive): PK (0x50, 0x4B)
		if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
			throw new Error('This file does not appear to be a valid DOCX document (magic bytes mismatch).');
		}
		const mammoth = await import('mammoth');
		const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
		text = result.value;
	} else {
		text = new TextDecoder('utf-8').decode(buffer);
	}

	const cleaned = cleanExtractedText(text);
	if (cleaned.length < 80) {
		throw new Error(
			'We could not find enough text in that file. Scanned PDFs need OCR first; paste the text into the editor instead.'
		);
	}

	const words = cleaned.split(/\s+/).filter(Boolean).length;
	return {
		text: cleaned.slice(0, 120_000),
		title: titleFromText(cleaned, file.name),
		words,
		keywords: extractKeywords(cleaned, 12).map((keyword) => keyword.term),
		fileType: extension
	};
}

export function sanitizeFileName(name: string): string {
	return name
		.replace(/[^\w.\-() ]+/g, '')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 140) || 'note-file';
}
