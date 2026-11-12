import type { App } from 'obsidian';
import type { TitleSaveResult } from '../../ports';
import type { Timers } from './cacheWait';
import { asRecord } from './frontmatterFields';
import { writeFrontmatter } from './frontmatterWrite';

/**
 * Writes the chosen title into `title` of the character note at `path` (titles S2, ADR-020), through
 * `processFrontMatter`, and nothing else: not `updated_by`, not the projection. It waits until the
 * metadata cache shows it, so the plaque read next already holds it. A missing note is `missing`; a
 * save that fails rejects and leaves the note as it was. Whether `title` was granted is checked before.
 */
export async function writeCharacterTitle(app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>, path: string, title: string, timers?: Timers): Promise<TitleSaveResult> {
	const result = await writeFrontmatter(
		app,
		path,
		(frontmatter) => {
			frontmatter.title = title;
			return 'done' as const;
		},
		(cached) => asRecord(cached).title === title,
		timers,
	);
	return result === 'done' ? 'saved' : 'missing';
}
