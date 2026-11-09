import type { Book } from '../../src/domain';
import type { BookRepository, BookWriteResult, FinishReadingFields, ReflectionText, StartReadingFields, StartReadingResult } from '../../src/ports';

/** A write the repository accepted, in the order it came. */
export type BookWrite =
	| { readonly method: 'startReading'; readonly path: string; readonly fields: StartReadingFields }
	| { readonly method: 'finishReading'; readonly path: string; readonly fields: FinishReadingFields };

/** A reflection with nothing written in any part. */
export const EMPTY_REFLECTION_TEXT: ReflectionText = { about: '', kept: '', changes: '', connects: '' };

/**
 * Book repository backed by a list, for use-case and container tests. Its writes change the
 * listed books with the same check as the vault: another `habitica_id` is never overwritten.
 */
export class InMemoryBookRepository implements BookRepository {
	readonly writes: BookWrite[] = [];
	/** Every write rejects with it, as a note that cannot be saved does. */
	failWritesWith: Error | null = null;
	/** `readReflection` rejects with it, as a note that cannot be read does. */
	failReadsWith: Error | null = null;
	/** What `readReflection` answers for each listed book, by path; a book without an entry has nothing written. */
	readonly reflections = new Map<string, ReflectionText>();

	constructor(private books: readonly Book[] = []) {}

	list(): Promise<readonly Book[]> {
		return Promise.resolve(this.books);
	}

	startReading(path: string, fields: StartReadingFields): Promise<StartReadingResult> {
		if (this.failWritesWith) return Promise.reject(this.failWritesWith);
		const book = this.books.find((candidate) => candidate.path === path);
		if (!book) return Promise.resolve('not-found');
		if (book.habiticaId !== null && book.habiticaId !== fields.habiticaId) return Promise.resolve('already-linked');

		this.writes.push({ method: 'startReading', path, fields });
		this.replace(book, { ...book, status: 'active', started: fields.started, habiticaId: fields.habiticaId });
		return Promise.resolve('done');
	}

	finishReading(path: string, fields: FinishReadingFields): Promise<BookWriteResult> {
		if (this.failWritesWith) return Promise.reject(this.failWritesWith);
		const book = this.books.find((candidate) => candidate.path === path);
		if (!book) return Promise.resolve('not-found');

		this.writes.push({ method: 'finishReading', path, fields });
		this.replace(book, { ...book, status: 'completed', finished: fields.finished });
		return Promise.resolve('done');
	}

	readReflection(path: string): Promise<ReflectionText | null> {
		if (this.failReadsWith) return Promise.reject(this.failReadsWith);
		if (!this.books.some((candidate) => candidate.path === path)) return Promise.resolve(null);
		return Promise.resolve(this.reflections.get(path) ?? EMPTY_REFLECTION_TEXT);
	}

	private replace(book: Book, next: Book): void {
		this.books = this.books.map((candidate) => (candidate === book ? next : candidate));
	}
}
