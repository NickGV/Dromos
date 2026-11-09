import { REFLECTION_SECTIONS, type Book, type ReflectionSection, type ReflectionSectionId } from '../../src/domain/library/Book';

/** The four reflection sections, with only `written` marked as written. */
export function aReflection(written: readonly ReflectionSectionId[]): ReflectionSection[] {
	return REFLECTION_SECTIONS.map((section) => ({ ...section, written: written.includes(section.id) }));
}

/** A book being planned, with no shelf and an empty reflection; override any field. */
export function aBook(overrides: Partial<Book> = {}): Book {
	return {
		path: '03 - Areas/Bibliotheke/Klara y el Sol - Kazuo Ishiguro.md',
		title: 'Klara y el Sol',
		author: 'Kazuo Ishiguro',
		shelf: null,
		status: 'planning',
		started: null,
		finished: null,
		habiticaId: null,
		reflection: aReflection([]),
		...overrides,
	};
}
