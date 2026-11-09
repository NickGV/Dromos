import { describe, expect, it } from 'vitest';
import { finishReadingInFrontmatter, showsFinished, showsStarted, startReadingInFrontmatter } from '../../../src/adapters/vault/bookWrite';

const ID = '3f2a1c8e-0000-4000-8000-000000000001';

/** A book note's frontmatter as Esdras creates it, plus any field. */
function book(extra: Record<string, unknown> = {}): Record<string, unknown> {
	return { type: 'book', title: 'Klara y el Sol', author: 'Kazuo Ishiguro', shelf: 'Ficción', status: 'planning', created: '2026-11-06', tags: ['book'], ...extra };
}

describe('startReadingInFrontmatter (S3, S4)', () => {
	it('writes status active, started and habitica_id, and leaves every other key as it was', () => {
		const frontmatter = book();

		expect(startReadingInFrontmatter(frontmatter, { started: '2026-11-09', habiticaId: ID })).toBe('done');
		expect(frontmatter).toEqual({ ...book(), status: 'active', started: '2026-11-09', habitica_id: ID });
	});

	it('replaces a missing, null or blank habitica_id', () => {
		for (const value of [undefined, null, '', '   ']) {
			const frontmatter = book({ habitica_id: value });

			expect(startReadingInFrontmatter(frontmatter, { started: '2026-11-09', habiticaId: ID })).toBe('done');
			expect(frontmatter.habitica_id).toBe(ID);
		}
	});

	it('keeps the same id exactly as the note writes it: a retry after a half-done start rewrites only the state and the date', () => {
		const frontmatter = book({ habitica_id: ` ${ID} ` });

		expect(startReadingInFrontmatter(frontmatter, { started: '2026-11-09', habiticaId: ID })).toBe('done');
		expect(frontmatter).toEqual(book({ habitica_id: ` ${ID} `, status: 'active', started: '2026-11-09' }));
	});

	it('never overwrites another to-do: a different id writes nothing', () => {
		for (const value of ['another-id', 5, false, {}, ['x']]) {
			const frontmatter = book({ habitica_id: value });
			const before = structuredClone(frontmatter);

			expect(startReadingInFrontmatter(frontmatter, { started: '2026-11-09', habiticaId: ID })).toBe('already-linked');
			expect(frontmatter).toEqual(before);
		}
	});

	it('writes nothing in a note that is no longer a book', () => {
		for (const frontmatter of [book({ type: 'resource' }), {}]) {
			const before = structuredClone(frontmatter);

			expect(startReadingInFrontmatter(frontmatter, { started: '2026-11-09', habiticaId: ID })).toBe('not-a-book');
			expect(frontmatter).toEqual(before);
		}
	});
});

describe('finishReadingInFrontmatter (S4)', () => {
	it('writes status completed and finished, and leaves every other key as it was', () => {
		const frontmatter = book({ status: 'active', started: '2026-11-01', habitica_id: ID });

		expect(finishReadingInFrontmatter(frontmatter, { finished: '2026-11-09' })).toBe('done');
		expect(frontmatter).toEqual(book({ status: 'completed', started: '2026-11-01', habitica_id: ID, finished: '2026-11-09' }));
	});

	it('writes nothing in a note that is no longer a book', () => {
		const frontmatter = book({ type: 'resource', status: 'active' });
		const before = structuredClone(frontmatter);

		expect(finishReadingInFrontmatter(frontmatter, { finished: '2026-11-09' })).toBe('not-a-book');
		expect(frontmatter).toEqual(before);
	});
});

describe('showsStarted and showsFinished: whether the cache already reflects a write', () => {
	it('is true once the cached frontmatter has the new status and date, whether the date is text or a Date', () => {
		expect(showsStarted({ status: 'active', started: '2026-11-09' }, { started: '2026-11-09' })).toBe(true);
		expect(showsStarted({ status: 'active', started: new Date(2026, 10, 9) }, { started: '2026-11-09' })).toBe(true);
		expect(showsFinished({ status: 'completed', finished: '2026-11-09' }, { finished: '2026-11-09' })).toBe(true);
	});

	it('is false while the cache still holds the old values, or holds nothing', () => {
		expect(showsStarted({ status: 'planning' }, { started: '2026-11-09' })).toBe(false);
		expect(showsStarted({ status: 'active', started: '2026-11-08' }, { started: '2026-11-09' })).toBe(false);
		expect(showsStarted(undefined, { started: '2026-11-09' })).toBe(false);
		expect(showsFinished({ status: 'active', finished: '2026-11-09' }, { finished: '2026-11-09' })).toBe(false);
		expect(showsFinished(null, { finished: '2026-11-09' })).toBe(false);
	});
});
