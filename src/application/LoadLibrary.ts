import type { Book } from '../domain';
import type { BookRepository } from '../ports';

export interface LoadLibraryDeps {
	/** Only the read: the library screen changes no book through this use case. */
	readonly books: Pick<BookRepository, 'list'>;
}

/** The books as the library screen receives them; a vault that cannot be read is said so, not hidden. */
export type LibraryState = { readonly kind: 'loaded'; readonly books: readonly Book[] } | { readonly kind: 'unreadable' };

/**
 * Reads the vault's books for the library screen (M7 S5). It touches no network and reads the
 * notes on every call, so a book Esdras added, or a reflection just written, shows on the next
 * read. Every book comes back, archived ones too: what the screen shows is the screen's rule.
 * Never rejects.
 */
export class LoadLibrary {
	constructor(private readonly deps: LoadLibraryDeps) {}

	async execute(): Promise<LibraryState> {
		try {
			return { kind: 'loaded', books: await this.deps.books.list() };
		} catch {
			return { kind: 'unreadable' };
		}
	}
}
