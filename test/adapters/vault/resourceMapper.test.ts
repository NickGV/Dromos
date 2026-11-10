import { describe, expect, it } from 'vitest';
import { buildResources, isArchiveNote, resourceFromNote, type ResourceNote } from '../../../src/adapters/vault/resourceMapper';
import { block, heading, metadataOf } from '../../fakes/noteMetadata';

const SAVED = { type: 'resource', sourceType: 'post', title: 'Cómo pensar en módulos', saved: '2026-11-07', url: 'https://martinfowler.com/a', status: 'seedling' };

function note(path: string, frontmatter: unknown, ...blocks: Parameters<typeof metadataOf>): ResourceNote {
	return { path, frontmatter, ...metadataOf(...blocks) };
}

describe('isArchiveNote: which notes enter the archive (ADR-018, M8 S3, S4)', () => {
	it('a `type: resource` note with a `saved` date enters, in any folder', () => {
		expect(isArchiveNote(note('04 - Resources/Posts-Papers/a.md', SAVED))).toBe(true);
		expect(isArchiveNote(note('01 - Inbox/a.md', SAVED))).toBe(true);
	});

	it('a resource without `saved`, or with an empty or unreadable one, does not', () => {
		const { saved: _saved, ...unsaved } = SAVED;
		expect(isArchiveNote(note('a.md', unsaved))).toBe(false);
		expect(isArchiveNote(note('a.md', { ...SAVED, saved: '' }))).toBe(false);
		expect(isArchiveNote(note('a.md', { ...SAVED, saved: 'ayer' }))).toBe(false);
	});

	it('a `reference` never enters, even with `saved`', () => {
		expect(isArchiveNote(note('04 - Resources/Teologia/a.md', { ...SAVED, sourceType: 'reference' }))).toBe(false);
	});

	it('a note of another type, or with no frontmatter, does not', () => {
		expect(isArchiveNote(note('a.md', { ...SAVED, type: 'book' }))).toBe(false);
		expect(isArchiveNote(note('a.md', undefined))).toBe(false);
	});

	it('a note in the templates folder does not, but a folder that only starts with its name does', () => {
		expect(isArchiveNote(note('Templates/resource.md', SAVED))).toBe(false);
		expect(isArchiveNote(note('Templates viejos/a.md', SAVED))).toBe(true);
	});
});

describe('resourceFromNote (M8 S3, S4)', () => {
	it('maps every field the archive reads', () => {
		expect(resourceFromNote(note('04 - Resources/Posts-Papers/Modulos.md', { ...SAVED, author: ' Martin Fowler ', why: 'entender los módulos', finished: '2026-11-09' }))).toEqual({
			path: '04 - Resources/Posts-Papers/Modulos.md',
			title: 'Cómo pensar en módulos',
			kind: 'post',
			author: 'Martin Fowler',
			url: 'https://martinfowler.com/a',
			why: 'entender los módulos',
			saved: '2026-11-07',
			finished: '2026-11-09',
			takeawayWritten: false,
		});
	});

	it('files each `sourceType` in its pigeonhole, ignoring case and spaces', () => {
		const kinds = ['post', 'paper', 'video', 'podcast', 'tool', 'course', ' Video '].map((sourceType) => resourceFromNote(note('a.md', { ...SAVED, sourceType })).kind);

		expect(kinds).toEqual(['post', 'paper', 'video', 'podcast', 'tool', 'course', 'video']);
	});

	it('an unknown or missing `sourceType` has no kind ("Sin tipo")', () => {
		const { sourceType: _sourceType, ...without } = SAVED;
		expect(resourceFromNote(note('a.md', { ...SAVED, sourceType: 'book' })).kind).toBeNull();
		expect(resourceFromNote(note('a.md', without)).kind).toBeNull();
	});

	it('a missing title falls back to the file name; missing author, url, why and finished are null', () => {
		expect(resourceFromNote(note('04 - Resources/El valor de aburrirse.md', { type: 'resource', saved: '2026-11-07' }))).toMatchObject({
			title: 'El valor de aburrirse',
			author: null,
			url: null,
			why: null,
			finished: null,
		});
	});

	it('keeps only http and https links, so "Abrir" never runs anything else', () => {
		const url = (value: unknown) => resourceFromNote(note('a.md', { ...SAVED, url: value })).url;

		expect(url(' http://example.com/x ')).toBe('http://example.com/x');
		expect(url('javascript:alert(1)')).toBeNull();
		expect(url('obsidian://open?vault=Logos')).toBeNull();
		expect(url('no es un enlace')).toBeNull();
		expect(url(42)).toBeNull();
	});

	it('reads dates written as YAML dates too', () => {
		const resource = resourceFromNote(note('a.md', { ...SAVED, saved: new Date(2026, 10, 7), finished: '2026-11-09T10:00' }));

		expect([resource.saved, resource.finished]).toEqual(['2026-11-07', '2026-11-09']);
	});

	it('the takeaway is written when a content block sits under "Lo que me dejó", sub-headings included', () => {
		const written = (...blocks: Parameters<typeof metadataOf>) => resourceFromNote(note('a.md', SAVED, ...blocks)).takeawayWritten;

		expect(written(block('yaml'), heading(1, 'Título'), block('paragraph'), heading(2, 'Lo que me dejó'))).toBe(false);
		expect(written(block('yaml'), heading(2, 'Lo que me dejó'), heading(2, 'Otra'), block('paragraph'))).toBe(false);
		expect(written(block('yaml'), heading(2, 'Lo que me dejó'), block('list'))).toBe(true);
		expect(written(block('yaml'), heading(2, 'Lo que me dejó'), heading(3, 'Una idea'), block('paragraph'))).toBe(true);
		expect(written(block('yaml'), heading(1, 'Título'))).toBe(false);
	});
});

describe('buildResources (M8 S3)', () => {
	it('keeps the archive notes only, the most recently saved first', () => {
		const resources = buildResources([
			note('old.md', { ...SAVED, title: 'Old', saved: '2026-11-01' }),
			note('book.md', { ...SAVED, type: 'book', title: 'Book' }),
			note('new.md', { ...SAVED, title: 'New', saved: '2026-11-08' }),
			note('Templates/resource.md', { ...SAVED, title: 'Template' }),
		]);

		expect(resources.map((resource) => resource.title)).toEqual(['New', 'Old']);
	});
});
