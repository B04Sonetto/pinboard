import { describe, it } from 'node:test';
import assert from 'node:assert';
import { extractKeywords, tokenize } from '../lib/keywords.js';
import {
	citationFor,
	isLspuStudentEmail,
	normalizeLspuEmail,
	safeHttpUrl,
	stripMarkdown,
	wordCount,
	readingTime
} from '../lib/utils.js';
import { extensionOf, isSupportedFile } from '../lib/server/extract.js';
import { generateStudy, type StudySource } from '../lib/server/study-engine.js';

describe('Pinboard Academic Engine Tests', () => {
	describe('LSPU student email validation', () => {
		it('accepts the required student number format regardless of letter case', () => {
			assert.strictEqual(isLspuStudentEmail('0324-0574@lspu.edu.ph'), true);
			assert.strictEqual(isLspuStudentEmail('0324-0574@LSPU.EDU.PH'), true);
			assert.strictEqual(isLspuStudentEmail('0000-0000@lspu.edu.ph'), true);
		});

		it('normalizes common input mistakes without accepting other domains', () => {
			assert.strictEqual(normalizeLspuEmail(' 03240574@LSPU.EDU.PH '), '0324-0574@lspu.edu.ph');
			assert.strictEqual(isLspuStudentEmail('0324–0574@lspu.edu.ph'), true);
			assert.strictEqual(isLspuStudentEmail('0324-0574@gmail.com'), false);
			assert.strictEqual(isLspuStudentEmail('abc-0574@lspu.edu.ph'), false);
			assert.strictEqual(isLspuStudentEmail('032-0574@lspu.edu.ph'), false);
		});
	});

	describe('Keywords extraction', () => {
		it('tokenizes text and ignores common stopwords', () => {
			const tokens = tokenize('The rapid brown fox jumps over the lazy dog and studies database normalization');
			assert.ok(!tokens.includes('the'));
			assert.ok(!tokens.includes('and'));
			assert.ok(!tokens.includes('over'));
			assert.ok(tokens.includes('database'));
			assert.ok(tokens.includes('normalization'));
		});

		it('extracts top keywords with frequency ranking', () => {
			const text = 'Relational database systems store relational tables. Every relational table has rows and columns in database design.';
			const keywords = extractKeywords(text, 5);
			assert.ok(keywords.length > 0);
			const terms = keywords.map((k) => k.term);
			assert.ok(terms.includes('relational') || terms.includes('database'));
		});
	});

	describe('AI quiz generation', () => {
		const sources: StudySource[] = [
			{
				id: 'note-database',
				title: 'Database design',
				status: 'verified',
				content: [
					'Normalization organizes a relational database so each fact is stored in exactly one place.',
					'First normal form requires atomic values and removes repeating groups from every database table.',
					'Second normal form removes partial dependencies from relations that use a composite primary key.',
					'Third normal form removes transitive dependencies between non-key columns in a database.'
				].join(' ')
			},
			{
				id: 'note-networking',
				title: 'Network fundamentals',
				status: 'verified',
				content: [
					'The OSI model describes seven layers that organize communication between connected computer systems.',
					'Routers forward internet protocol packets between separate networks using logical addresses.',
					'Domain name system servers translate human-readable hostnames into network addresses.',
					'Transmission control protocol retransmits lost data and provides reliable ordered delivery.'
				].join(' ')
			}
		];

		it('creates distinct source-grounded questions with valid, varied answer choices', () => {
			const result = generateStudy('quiz', sources, { questionCount: 8, difficulty: 'standard' });
			const questions = result.payload.questions ?? [];
			const identification = result.payload.identification ?? [];

			assert.ok(questions.length >= 5);
			assert.ok(questions.length <= 8);
			assert.ok(identification.length > 0);
			assert.ok(
				identification.every((question) => question.prompt.includes('_____') && question.answer.length > 0)
			);
			assert.strictEqual(result.payload.options?.identificationCount, identification.length);
			assert.strictEqual(new Set(questions.map((question) => question.prompt)).size, questions.length);
			for (const question of questions) {
				assert.ok(question.options.length >= 2);
				assert.ok(question.options.length <= 4);
				assert.strictEqual(
					new Set(question.options.map((option) => option.toLowerCase())).size,
					question.options.length
				);
				assert.ok(question.answer >= 0 && question.answer < question.options.length);
				assert.ok(question.explanation.length > 0);
				assert.ok(sources.some((source) => source.id === question.sourceNoteId));
			}
		});

		it('uses attached notes as quiz sources alongside selected notes', () => {
			const ownNotes = [
				'Photosynthesis converts light energy into chemical energy stored in glucose molecules.',
				'Chlorophyll absorbs light wavelengths that power chemical reactions inside plant cells.',
				'Stomata regulate gas exchange by allowing carbon dioxide to enter the leaf tissues.'
			].join(' ');
			const result = generateStudy('quiz', [sources[0]], {
				questionCount: 3,
				difficulty: 'standard',
				ownNotes
			});

			assert.ok(
				result.payload.questions?.some((question) => question.sourceTitle === 'Your attached notes')
			);
			assert.ok(result.payload.identification?.length);
		});

		it('explains when selected notes are too thin to build a quiz', () => {
			assert.throws(
				() =>
					generateStudy('quiz', [
						{
							id: 'note-short',
							title: 'Short note',
							status: 'verified',
							content: 'A few words.'
						}
					]),
				/ not contain enough distinct, sentence-level information /
			);
		});
	});

	describe('Text and Security Utils', () => {
		it('safely strips markdown formatting', () => {
			const md = '# Header 1\n\nThis is **bold** and *italic* with [a link](https://example.com) and `code`.';
			const plain = stripMarkdown(md);
			assert.ok(!plain.includes('#'));
			assert.ok(!plain.includes('**'));
			assert.ok(plain.includes('bold'));
			assert.ok(plain.includes('italic'));
			assert.ok(plain.includes('a link'));
		});

		it('sanitizes external URLs to prevent javascript: pseudo-protocols', () => {
			assert.strictEqual(safeHttpUrl('javascript:alert(1)'), null);
			assert.strictEqual(safeHttpUrl('data:text/html,evil'), null);
			assert.strictEqual(safeHttpUrl('https://example.com/syllabus'), 'https://example.com/syllabus');
			assert.strictEqual(safeHttpUrl('http://mit.edu/course'), 'http://mit.edu/course');
		});

		it('calculates word counts and reading time accurately', () => {
			assert.strictEqual(wordCount('one two three four five'), 5);
			assert.strictEqual(wordCount(''), 0);
			assert.ok(readingTime('a '.repeat(300)).includes('min read'));
		});
	});

	describe('Academic Provenance Citation', () => {
		const mockNote: any = {
			id: '123e4567-e89b-12d3-a456-426614174000',
			title: 'Database Normalization Notes',
			created_at: '2026-03-01T12:00:00Z',
			author: { full_name: 'Elena Santos' }
		};

		it('formats APA citations correctly', () => {
			const apa = citationFor(mockNote, 'apa', 'https://pinboard.edu/notes/1');
			assert.ok(apa.includes('Santos, E.'));
			assert.ok(apa.includes('(2026)'));
			assert.ok(apa.includes('Database Normalization Notes'));
			assert.ok(apa.includes('Pinboard.'));
		});

		it('formats MLA citations correctly', () => {
			const mla = citationFor(mockNote, 'mla', 'https://pinboard.edu/notes/1');
			assert.ok(mla.includes('Santos, Elena'));
			assert.ok(mla.includes('“Database Normalization Notes.”'));
		});

		it('formats Chicago citations correctly', () => {
			const chicago = citationFor(mockNote, 'chicago', 'https://pinboard.edu/notes/1');
			assert.ok(chicago.includes('Santos, Elena'));
			assert.ok(chicago.includes('“Database Normalization Notes.”'));
		});
	});

	describe('File Extraction and Security', () => {
		it('extracts file extensions safely', () => {
			assert.strictEqual(extensionOf('lecture-notes.pdf'), 'pdf');
			assert.strictEqual(extensionOf('review.DOCX'), 'docx');
			assert.strictEqual(extensionOf('summary.markdown'), 'markdown');
			assert.strictEqual(extensionOf('noextension'), '');
		});

		it('allows supported educational file types and rejects unsafe extensions', () => {
			assert.strictEqual(isSupportedFile('document.pdf'), true);
			assert.strictEqual(isSupportedFile('notes.docx'), true);
			assert.strictEqual(isSupportedFile('summary.txt'), true);
			assert.strictEqual(isSupportedFile('notes.md'), true);
			assert.strictEqual(isSupportedFile('malicious.exe'), false);
			assert.strictEqual(isSupportedFile('script.sh'), false);
			assert.strictEqual(isSupportedFile('payload.js'), false);
			assert.strictEqual(isSupportedFile('hack.php'), false);
		});
	});
});
