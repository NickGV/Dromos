import { describe, expect, it } from 'vitest';
import { markFinishedInFrontmatter, showsMarkedFinished } from '../../../src/adapters/vault/resourceWrite';

describe('markFinishedInFrontmatter: "Marcar como leído" (M8 S6)', () => {
	it('writes only `finished` in a resource that has none', () => {
		const frontmatter: Record<string, unknown> = { type: 'resource', status: 'seedling', saved: '2026-11-07', finished: '' };

		expect(markFinishedInFrontmatter(frontmatter, { finished: '2026-11-10' })).toBe('done');
		expect(frontmatter).toEqual({ type: 'resource', status: 'seedling', saved: '2026-11-07', finished: '2026-11-10' });
	});

	it('leaves a note that is no longer a resource as it was', () => {
		const frontmatter: Record<string, unknown> = { type: 'book', saved: '2026-11-07' };

		expect(markFinishedInFrontmatter(frontmatter, { finished: '2026-11-10' })).toBe('not-a-resource');
		expect(frontmatter).toEqual({ type: 'book', saved: '2026-11-07' });
	});

	it('keeps a `finished` date already in the note', () => {
		const frontmatter: Record<string, unknown> = { type: 'resource', finished: '2026-11-09' };

		expect(markFinishedInFrontmatter(frontmatter, { finished: '2026-11-10' })).toBe('already-finished');
		expect(frontmatter).toEqual({ type: 'resource', finished: '2026-11-09' });
	});
});

describe('showsMarkedFinished', () => {
	it('is true only when the cached frontmatter holds that `finished` date', () => {
		expect(showsMarkedFinished({ type: 'resource', finished: '2026-11-10' }, { finished: '2026-11-10' })).toBe(true);
		expect(showsMarkedFinished({ type: 'resource', finished: '' }, { finished: '2026-11-10' })).toBe(false);
		expect(showsMarkedFinished(undefined, { finished: '2026-11-10' })).toBe(false);
	});
});
