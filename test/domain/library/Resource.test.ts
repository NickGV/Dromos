import { describe, expect, it } from 'vitest';
import { compareByFinished, compareBySaved, resourceState, resourceVerb, RESOURCE_KINDS } from '../../../src/domain';
import { aResource } from '../../fakes/resources';

describe('resourceState (ADR-018, M8 S3)', () => {
	it('a saved resource with no finished date is pending', () => {
		expect(resourceState(aResource({ finished: null, takeawayWritten: false }))).toBe('pending');
	});

	it('text under "Lo que me dejó" without a finished date is still pending', () => {
		expect(resourceState(aResource({ finished: null, takeawayWritten: true }))).toBe('pending');
	});

	it('a finished resource without its takeaway is takeaway-missing', () => {
		expect(resourceState(aResource({ finished: '2026-11-09', takeawayWritten: false }))).toBe('takeaway-missing');
	});

	it('a finished resource with its takeaway written is processed', () => {
		expect(resourceState(aResource({ finished: '2026-11-09', takeawayWritten: true }))).toBe('processed');
	});
});

describe('resourceVerb (M8 S4)', () => {
	it('articles, papers, pages and resources with no kind are read; videos and courses watched; podcasts listened to', () => {
		expect(RESOURCE_KINDS.map((kind) => [kind, resourceVerb(kind)])).toEqual([
			['post', 'read'],
			['paper', 'read'],
			['video', 'watch'],
			['podcast', 'listen'],
			['tool', 'read'],
			['course', 'watch'],
		]);
		expect(resourceVerb(null)).toBe('read');
	});
});

describe('the archive orders (M8 S5)', () => {
	it('compareBySaved puts the most recently saved first, then title, then path', () => {
		const older = aResource({ title: 'A', saved: '2026-11-01' });
		const newerB = aResource({ title: 'B', saved: '2026-11-08' });
		const newerA = aResource({ title: 'Á', saved: '2026-11-08', path: 'z.md' });
		const newerA2 = aResource({ title: 'Á', saved: '2026-11-08', path: 'a.md' });

		expect([older, newerB, newerA, newerA2].sort(compareBySaved)).toEqual([newerA2, newerA, newerB, older]);
	});

	it('compareByFinished puts the most recently finished first, a resource with no date last, then the saved order', () => {
		const early = aResource({ title: 'Early', finished: '2026-11-02' });
		const late = aResource({ title: 'Late', finished: '2026-11-09' });
		const none = aResource({ title: 'None', finished: null });
		const lateSavedLater = aResource({ title: 'Later save', finished: '2026-11-09', saved: '2026-11-08' });

		expect([none, early, late, lateSavedLater].sort(compareByFinished)).toEqual([lateSavedLater, late, early, none]);
	});
});
