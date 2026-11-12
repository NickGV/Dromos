import type { App } from 'obsidian';
import type { TitleLoadResult, TitleRepository } from '../../ports';
import { parseTitlesNote } from './titlesNote';

/**
 * The titles Esdras grants, `<Dromos folder>/Titles.md` (titles S3, ADR-020): read by its path whatever
 * its `type` says, on open and after each sync. Only Esdras writes it; Dromos never does.
 */
export class VaultTitleRepository implements TitleRepository {
	constructor(
		private readonly app: Pick<App, 'vault'>,
		/** The note's vault path, normalized, for example `Dromos/Titles.md`. */
		private readonly notePath: () => string,
	) {}

	async load(): Promise<TitleLoadResult> {
		const path = this.notePath();
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { titles: [], unreadable: [] };
		const { titles, unreadable } = parseTitlesNote(await this.app.vault.cachedRead(file));
		return { titles, unreadable: unreadable.map((line) => ({ path, ...line })) };
	}
}
