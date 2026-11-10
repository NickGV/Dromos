import type { App } from 'obsidian';
import { TAKEAWAY_HEADING, type Resource } from '../../domain';
import type { MarkFinishedFields, ResourceRepository, ResourceWriteResult } from '../../ports';
import type { Timers } from './cacheWait';
import { asRecord } from './frontmatterFields';
import { writeFrontmatter } from './frontmatterWrite';
import { sectionText } from './reflectionText';
import { buildResources, type ResourceNote } from './resourceMapper';
import { markFinishedInFrontmatter, showsMarkedFinished } from './resourceWrite';

/**
 * The archive's resources read from the vault with `metadataCache` (ADR-018): the frontmatter for
 * the fields and the cached headings and sections for the takeaway, which decide the seal without
 * reading the body as text. Notes without a cache entry yet are skipped; the next read sees them.
 * The body is read only by `readTakeaway`, for the card. The only write is `finished`.
 */
export class VaultResourceRepository implements ResourceRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		/** Timers for the cache wait; the window's when absent. */
		private readonly timers?: Timers,
	) {}

	list(): Promise<readonly Resource[]> {
		return Promise.resolve(buildResources(this.notes()));
	}

	markFinished(path: string, fields: MarkFinishedFields): Promise<ResourceWriteResult> {
		return writeFrontmatter(
			this.app,
			path,
			(frontmatter) => markFinishedInFrontmatter(frontmatter, fields),
			(cached) => showsMarkedFinished(cached, fields),
			this.timers,
		);
	}

	async readTakeaway(path: string): Promise<string | null> {
		const file = this.app.vault.getFileByPath(path);
		if (!file) return null;
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache || asRecord(cache.frontmatter).type !== 'resource') return null;
		return sectionText(await this.app.vault.cachedRead(file), cache.headings ?? [], TAKEAWAY_HEADING);
	}

	private notes(): ResourceNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const cache = this.app.metadataCache.getFileCache(file);
			if (!cache || asRecord(cache.frontmatter).type !== 'resource') return [];
			return [{ path: file.path, frontmatter: cache.frontmatter, headings: cache.headings ?? [], sections: cache.sections ?? [] }];
		});
	}
}
