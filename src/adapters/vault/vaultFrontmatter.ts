import { getFrontMatterInfo, parseYaml, type App, type TFile } from 'obsidian';

/**
 * Frontmatter from `metadataCache`. Right after Obsidian starts the cache may have no
 * entry for the note yet; then the file is read and parsed with Obsidian's own helpers
 * instead of returning nothing. Broken YAML yields `undefined`.
 */
export async function frontmatterOf(app: Pick<App, 'vault' | 'metadataCache'>, file: TFile): Promise<unknown> {
	const cached = app.metadataCache.getFileCache(file);
	if (cached) return cached.frontmatter;
	const info = getFrontMatterInfo(await app.vault.cachedRead(file));
	if (!info.exists) return undefined;
	try {
		return parseYaml(info.frontmatter) as unknown;
	} catch {
		return undefined;
	}
}

/** The `subscribe` argument of `waitForCache`: listens to the cache's "changed" event. */
export function onCacheChanged(app: Pick<App, 'metadataCache'>): (onChanged: (path: string) => void) => () => void {
	return (onChanged) => {
		const ref = app.metadataCache.on('changed', (changed) => onChanged(changed.path));
		return () => app.metadataCache.offref(ref);
	};
}
