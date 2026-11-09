import type { LifecycleStatus } from '../campaign/Campaign';

/** Stable keys of the four reflection sections, so the screen can name them in any language. */
export type ReflectionSectionId = 'about' | 'kept' | 'changes' | 'connects';

/** One of the four reflection sections of a book note (Q026). */
export interface ReflectionSection {
	readonly id: ReflectionSectionId;
	/** The heading exactly as `Templates/book.md` writes it. */
	readonly heading: string;
	/** True when at least one block of content sits under its heading. */
	readonly written: boolean;
}

/** The four sections of the reflection, in the order the note and the screen use (ADR-016). */
export const REFLECTION_SECTIONS: readonly { readonly id: ReflectionSectionId; readonly heading: string }[] = [
	{ id: 'about', heading: 'De qué trata' },
	{ id: 'kept', heading: 'Qué me quedó' },
	{ id: 'changes', heading: 'Qué cambia en mí' },
	{ id: 'connects', heading: 'Con qué lo conecto' },
];

/** A `type: book` note of the vault (ADR-016). Esdras creates it; Dromos only changes its state. */
export interface Book {
	/** Vault path of the note, used to open it. */
	readonly path: string;
	readonly title: string;
	readonly author: string | null;
	/** One shelf, as written in the note; `null` puts the book on "no shelf" (Q025). */
	readonly shelf: string | null;
	readonly status: LifecycleStatus;
	/** Local date as `YYYY-MM-DD`, or `null`. */
	readonly started: string | null;
	/** Local date as `YYYY-MM-DD`, or `null`. */
	readonly finished: string | null;
	/** Habitica id of the reading to-do; `null` while the book has not been started from Dromos. */
	readonly habiticaId: string | null;
	/** The four sections, always all four and in `REFLECTION_SECTIONS` order. */
	readonly reflection: readonly ReflectionSection[];
}

/**
 * What the library shows for a book. `sealed` is a completed book with its whole
 * reflection; a completed book missing any section is `reflection-missing` (Q026).
 */
export type BookState = 'pending' | 'reading' | 'paused' | 'sealed' | 'reflection-missing' | 'archived';

/**
 * True only when each of the four sections is in the list and written. A section that is
 * missing from the list counts as unwritten, so a short list never seals a book.
 */
export function isReflectionWritten(reflection: readonly ReflectionSection[]): boolean {
	return REFLECTION_SECTIONS.every(({ id }) => reflection.some((section) => section.id === id && section.written));
}

/** Title order (Spanish), then path, so a list of books never depends on the order the vault lists its files. */
export function compareBooks(left: Pick<Book, 'title' | 'path'>, right: Pick<Book, 'title' | 'path'>): number {
	return left.title.localeCompare(right.title, 'es') || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

/** The state the library shows: the lifecycle `status`, with `completed` split by the reflection (Q026). */
export function bookState(book: Pick<Book, 'status' | 'reflection'>): BookState {
	switch (book.status) {
		case 'planning':
			return 'pending';
		case 'active':
			return 'reading';
		case 'paused':
			return 'paused';
		case 'archived':
			return 'archived';
		case 'completed':
			return isReflectionWritten(book.reflection) ? 'sealed' : 'reflection-missing';
	}
}
