import { getFrontMatterInfo, normalizePath, type App } from 'obsidian';
import type { BriefingLoadResult, BriefingRepository } from '../../ports';
import { briefingFromNote } from './briefingMapper';
import { briefingNotePath } from './folderPath';
import { frontmatterIn } from './vaultFrontmatter';

/** `Briefing.md`, read on every load so what Esdras wrote shows on the next sync. Dromos never writes it. */
export class VaultBriefingRepository implements BriefingRepository {
	constructor(
		private readonly app: Pick<App, 'vault'>,
		private readonly vaultFolder: () => string,
	) {}

	async load(): Promise<BriefingLoadResult> {
		const path = normalizePath(briefingNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { kind: 'missing' };
		// Both parts come from one read, not from the metadata cache: Esdras writes from outside
		// Obsidian, and a cache still on yesterday's note would dim today's text.
		const content = await this.app.vault.cachedRead(file);
		const body = content.slice(getFrontMatterInfo(content).contentStart);
		return { kind: 'found', briefing: briefingFromNote(path, frontmatterIn(content), body) };
	}
}
