import { normalizePath } from 'obsidian';

/**
 * A note's vault path under the folder setting, normalized as Obsidian wants it, read each time so
 * an edited setting applies at once: `notePathIn(folder, purseNotePath)` gives `Dromos/Purse.md`.
 * The repositories take the function, so they never import Obsidian at run time.
 */
export function notePathIn(folder: () => string, path: (folder: string) => string): () => string {
	return () => normalizePath(path(folder()));
}
