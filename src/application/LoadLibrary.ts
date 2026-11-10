import type { Book, Resource } from '../domain';
import type { BookRepository, ResourceRepository } from '../ports';

export interface LoadLibraryDeps {
	/** Only the read: the library screen changes no book through this use case. */
	readonly books: Pick<BookRepository, 'list'>;
	/** Only the read: the archive's resources (ADR-018). */
	readonly resources: Pick<ResourceRepository, 'list'>;
}

/** The books and the archive's resources as the library screen receives them; a vault that cannot be read is said so, not hidden. */
export type LibraryState = { readonly kind: 'loaded'; readonly books: readonly Book[]; readonly resources: readonly Resource[] } | { readonly kind: 'unreadable' };

/**
 * Reads the vault's books (M7 S5) and the archive's resources (M8 S3) for the library screen. It
 * touches no network and reads the notes on every call, so a book or a link Esdras added, or a
 * reflection just written, shows on the next read. Every book comes back, archived ones too: what
 * the screen shows is the screen's rule. Never rejects.
 */
export class LoadLibrary {
	constructor(private readonly deps: LoadLibraryDeps) {}

	async execute(): Promise<LibraryState> {
		try {
			const [books, resources] = await Promise.all([this.deps.books.list(), this.deps.resources.list()]);
			return { kind: 'loaded', books, resources };
		} catch {
			return { kind: 'unreadable' };
		}
	}
}
