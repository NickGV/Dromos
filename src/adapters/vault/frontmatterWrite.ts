import type { App, TFile } from 'obsidian';
import { waitForCache, type Timers } from './cacheWait';

/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Writes the frontmatter of the note at `path` through `processFrontMatter`: `apply` decides and
 * makes the change inside it and answers what it did. After a `'done'` it waits, at most
 * `CACHE_WAIT_MS`, until the metadata cache shows the write (`shown` over the cached frontmatter),
 * so the next read, which decides which buttons show, already sees the new state. A missing note
 * is `'not-found'`; a save that fails rejects. Shared by the book and resource repositories.
 */
export async function writeFrontmatter<Result extends string>(
	app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
	path: string,
	apply: (frontmatter: Record<string, unknown>) => Result,
	shown: (cached: unknown) => boolean,
	timers?: Timers,
): Promise<Result | 'not-found'> {
	const file = app.vault.getFileByPath(path);
	if (!file) return 'not-found';

	let result = 'not-found' as Result | 'not-found';
	await app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
		result = apply(frontmatter);
	});
	if (result === 'done') {
		await waitForCache((onChanged) => onCacheChanged(app, onChanged), file.path, () => shown(app.metadataCache.getFileCache(file)?.frontmatter), CACHE_WAIT_MS, timers);
	}
	return result;
}

/**
 * The same subscription as `onCacheChanged` in `vaultFrontmatter.ts`, which cannot be imported
 * here: that module loads Obsidian's runtime, which the tests of this repository do not have.
 */
function onCacheChanged(app: Pick<App, 'metadataCache'>, onChanged: (path: string) => void): () => void {
	const ref = app.metadataCache.on('changed', (changed: TFile) => onChanged(changed.path));
	return () => app.metadataCache.offref(ref);
}
