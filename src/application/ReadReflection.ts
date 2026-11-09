import type { BookRepository, ReflectionText } from '../ports';

export interface ReadReflectionDeps {
	/** Only the read: the card changes nothing through this use case. */
	readonly books: Pick<BookRepository, 'readReflection'>;
}

/**
 * Reads what the user wrote in each part of a book's reflection, for the card to show read-only
 * (M7 S5). It reads the note on every call, so text written since the last open shows, and it
 * touches no network. It never decides the seal: that comes from the cache (Q026). Never
 * rejects: a note that cannot be read is `null`, as a missing note or one that is not a book is.
 */
export class ReadReflection {
	constructor(private readonly deps: ReadReflectionDeps) {}

	async execute(path: string): Promise<ReflectionText | null> {
		try {
			return await this.deps.books.readReflection(path);
		} catch {
			return null;
		}
	}
}
