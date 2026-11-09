import type { App } from 'obsidian';
import type { Book } from '../../domain';
import type { BookRepository } from '../../ports';
import { buildBooks, type BookNote } from './bookMapper';
import { asRecord } from './frontmatterFields';

/**
 * Books read from the vault with `metadataCache` (ADR-016): the frontmatter for the fields and
 * the cached headings and sections for the reflection, never the body as text (Q026). Notes
 * without a cache entry yet (right after Obsidian starts) are skipped; the next read sees them.
 */
export class VaultBookRepository implements BookRepository {
	constructor(private readonly app: Pick<App, 'vault' | 'metadataCache'>) {}

	list(): Promise<readonly Book[]> {
		return Promise.resolve(buildBooks(this.notes()));
	}

	private notes(): BookNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache || asRecord(cache.frontmatter).type !== 'book') return [];
			return [{ path: file.path, frontmatter: cache.frontmatter, headings: cache.headings ?? [], sections: cache.sections ?? [] }];
		});
	}
}
