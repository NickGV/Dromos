import type { App } from 'obsidian';
import type { Book } from '../../domain';
import type { BookRepository, BookWriteResult, FinishReadingFields, ReflectionText, StartReadingFields, StartReadingResult } from '../../ports';
import { buildBooks, type BookNote } from './bookMapper';
import { finishReadingInFrontmatter, showsFinished, showsStarted, startReadingInFrontmatter } from './bookWrite';
import type { Timers } from './cacheWait';
import { asRecord } from './frontmatterFields';
import { writeFrontmatter } from './frontmatterWrite';
import { reflectionText } from './reflectionText';

/**
 * Books read from the vault with `metadataCache` (ADR-016): the frontmatter for the fields and
 * the cached headings and sections for the reflection, which decide the seal without reading the
 * body as text (Q026). Notes without a cache entry yet (right after Obsidian starts) are skipped;
 * the next read sees them. The body is read only by `readReflection`, for the card to show what
 * was written. The only writes are the state changes of S4, through `processFrontMatter`.
 */
export class VaultBookRepository implements BookRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		/** Timers for the cache wait; the window's when absent. */
		private readonly timers?: Timers,
	) {}

	list(): Promise<readonly Book[]> {
		return Promise.resolve(buildBooks(this.notes()));
	}

	startReading(path: string, fields: StartReadingFields): Promise<StartReadingResult> {
		return this.write(
			path,
			(frontmatter) => startReadingInFrontmatter(frontmatter, fields),
			(cached) => showsStarted(cached, fields),
		);
	}

	finishReading(path: string, fields: FinishReadingFields): Promise<BookWriteResult> {
		return this.write(
			path,
			(frontmatter) => finishReadingInFrontmatter(frontmatter, fields),
			(cached) => showsFinished(cached, fields),
		);
	}

	async readReflection(path: string): Promise<ReflectionText | null> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) return null;
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache || asRecord(cache.frontmatter).type !== 'book') return null;
		return reflectionText(await this.app.vault.cachedRead(file), cache.headings ?? []);
	}

	private write<Result extends StartReadingResult>(path: string, apply: (frontmatter: Record<string, unknown>) => Result, shown: (cached: unknown) => boolean): Promise<Result | 'not-found'> {
		return writeFrontmatter(this.app, path, apply, shown, this.timers);
	}

	private notes(): BookNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache || asRecord(cache.frontmatter).type !== 'book') return [];
			return [{ path: file.path, frontmatter: cache.frontmatter, headings: cache.headings ?? [], sections: cache.sections ?? [] }];
		});
	}
}
