import type { App, TFile } from 'obsidian';
import type { Book } from '../../domain';
import type { BookRepository, BookWriteResult, FinishReadingFields, StartReadingFields, StartReadingResult } from '../../ports';
import { buildBooks, type BookNote } from './bookMapper';
import { finishReadingInFrontmatter, showsFinished, showsStarted, startReadingInFrontmatter } from './bookWrite';
import { waitForCache, type Timers } from './cacheWait';
import { asRecord } from './frontmatterFields';

/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Books read from the vault with `metadataCache` (ADR-016): the frontmatter for the fields and
 * the cached headings and sections for the reflection, never the body as text (Q026). Notes
 * without a cache entry yet (right after Obsidian starts) are skipped; the next read sees them.
 * The only writes are the state changes of S4, through `processFrontMatter`.
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

	private async write<Result extends StartReadingResult>(
		path: string,
		apply: (frontmatter: Record<string, unknown>) => Result,
		shown: (cached: unknown) => boolean,
	): Promise<Result | 'not-found'> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) return 'not-found';

		let result = 'not-found' as Result | 'not-found';
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			result = apply(frontmatter);
		});
		// Obsidian re-reads the frontmatter after saving; wait for it so the next read, which
		// decides whether "Empezar a leer" shows again, already sees the new state.
		if (result === 'done') {
			await waitForCache(
				(onChanged) => this.onCacheChanged(onChanged),
				file.path,
				() => shown(this.app.metadataCache.getFileCache(file)?.frontmatter),
				CACHE_WAIT_MS,
				this.timers,
			);
		}
		return result;
	}

	/**
	 * The same subscription as `onCacheChanged` in `vaultFrontmatter.ts`, which cannot be imported
	 * here: that module loads Obsidian's runtime, which the tests of this repository do not have.
	 */
	private onCacheChanged(onChanged: (path: string) => void): () => void {
		const ref = this.app.metadataCache.on('changed', (changed: TFile) => onChanged(changed.path));
		return () => this.app.metadataCache.offref(ref);
	}

	private notes(): BookNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache || asRecord(cache.frontmatter).type !== 'book') return [];
			return [{ path: file.path, frontmatter: cache.frontmatter, headings: cache.headings ?? [], sections: cache.sections ?? [] }];
		});
	}
}
