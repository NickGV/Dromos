import type { Book } from '../domain';

/** What a state change in a book note did. */
export type BookWriteResult =
	/** The note was written. */
	| 'done'
	/** No note at that path. */
	| 'not-found'
	/** The note exists but its `type` is no longer `book`: nothing was written. */
	| 'not-a-book';

/**
 * What `startReading` did. Besides a `BookWriteResult`, `already-linked`: the note already
 * holds another `habitica_id`, so nothing was written and that to-do stays the book's.
 */
export type StartReadingResult = BookWriteResult | 'already-linked';

/** What "Empezar a leer" writes into a book note. */
export interface StartReadingFields {
	/** Local date as `YYYY-MM-DD`. */
	readonly started: string;
	/** Habitica id of the reading to-do. */
	readonly habiticaId: string;
}

/** What "Terminar" writes into a book note. */
export interface FinishReadingFields {
	/** Local date as `YYYY-MM-DD`. */
	readonly finished: string;
}

/**
 * Books stored in the vault: every `type: book` note (ADR-016). Dromos writes only the state
 * changes of "Empezar a leer" and "Terminar" (S4), and only their keys: never the body.
 */
export interface BookRepository {
	/** Every book, sorted by title then path, whatever its folder or status. */
	list(): Promise<readonly Book[]>;

	/**
	 * Writes `status: active`, `started` and `habitica_id`. An id the note already holds is kept
	 * as written; a different one is never overwritten. May reject when the note cannot be saved.
	 */
	startReading(path: string, fields: StartReadingFields): Promise<StartReadingResult>;

	/** Writes `status: completed` and `finished`. May reject when the note cannot be saved. */
	finishReading(path: string, fields: FinishReadingFields): Promise<BookWriteResult>;
}
