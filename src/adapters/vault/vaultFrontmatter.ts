import { getFrontMatterInfo, parseYaml, type App, type TFile } from 'obsidian';

/**
 * Frontmatter from `metadataCache`. Right after Obsidian starts the cache may have no
 * entry for the note yet; then the file is read and parsed with Obsidian's own helpers
 * instead of returning nothing. Broken YAML yields `undefined`.
 */
export async function frontmatterOf(app: Pick<App, 'vault' | 'metadataCache'>, file: TFile): Promise<unknown> {
	const cached = app.metadataCache.getFileCache(file);
	if (cached) return cached.frontmatter;
	return frontmatterIn(await app.vault.cachedRead(file));
}

/** The frontmatter written in the text of a note. Broken YAML yields `undefined`. */
export function frontmatterIn(content: string): unknown {
	const info = getFrontMatterInfo(content);
	if (!info.exists) return undefined;
	try {
		return parseYaml(info.frontmatter) as unknown;
	} catch {
		return undefined;
	}
}

// Lives in `cacheWait.ts`, which imports no `obsidian` runtime, so repositories that use it stay testable.
export { onCacheChanged } from './cacheWait';
