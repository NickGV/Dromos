import { describe, expect, it } from 'vitest';
import type { LifecycleStatus } from '../../../src/domain/campaign/Campaign';
import { bookState, isReflectionWritten, REFLECTION_SECTIONS } from '../../../src/domain/library/Book';
import { aBook, aReflection } from '../../fakes/books';

describe('REFLECTION_SECTIONS: the four parts of a reflection (S2, Q026)', () => {
	it('lists the four headings of the template, in order', () => {
		expect(REFLECTION_SECTIONS.map((section) => section.heading)).toEqual(['De qué trata', 'Qué me quedó', 'Qué cambia en mí', 'Con qué lo conecto']);
	});
});

describe('isReflectionWritten: a reflection is whole when its four sections have text (S2)', () => {
	it('is true with all four written', () => {
		expect(isReflectionWritten(aReflection(['about', 'kept', 'changes', 'connects']))).toBe(true);
	});

	it('is false when one section is empty', () => {
		expect(isReflectionWritten(aReflection(['about', 'kept', 'connects']))).toBe(false);
	});

	it('is false with none written', () => {
		expect(isReflectionWritten(aReflection([]))).toBe(false);
	});

	it('is false when a section is missing from the list, never true by default', () => {
		const three = aReflection(['about', 'kept', 'changes', 'connects']).slice(0, 3);
		expect(isReflectionWritten(three)).toBe(false);
	});
});

describe('bookState: what the library shows for a book (S1, S2)', () => {
	it.each<[LifecycleStatus, string]>([
		['planning', 'pending'],
		['active', 'reading'],
		['paused', 'paused'],
		['archived', 'archived'],
	])('a %s book is %s', (status, state) => {
		expect(bookState(aBook({ status }))).toBe(state);
	});

	it('a completed book with all four sections written is sealed', () => {
		expect(bookState(aBook({ status: 'completed', reflection: aReflection(['about', 'kept', 'changes', 'connects']) }))).toBe('sealed');
	});

	it('a completed book with one section empty is missing its reflection', () => {
		expect(bookState(aBook({ status: 'completed', reflection: aReflection(['about', 'kept', 'changes']) }))).toBe('reflection-missing');
	});

	it('a completed book with no reflection at all is missing its reflection', () => {
		expect(bookState(aBook({ status: 'completed', reflection: aReflection([]) }))).toBe('reflection-missing');
	});

	it('a written reflection does not seal a book that is not completed', () => {
		expect(bookState(aBook({ status: 'active', reflection: aReflection(['about', 'kept', 'changes', 'connects']) }))).toBe('reading');
	});
});
