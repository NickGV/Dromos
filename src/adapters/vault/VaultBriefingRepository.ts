import { getFrontMatterInfo, normalizePath, type App } from 'obsidian';
import type { BriefingLoadResult, BriefingRepository } from '../../ports';
import { briefingFromNote } from './briefingMapper';
import { briefingNotePath } from './folderPath';
import { frontmatterOf } from './vaultFrontmatter';

/** `Briefing.md`, read on every load so what Esdras wrote shows on the next sync. Dromos never writes it. */
export class VaultBriefingRepository implements BriefingRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache'>,
		private readonly vaultFolder: () => string,
	) {}

	async load(): Promise<BriefingLoadResult> {
		const path = normalizePath(briefingNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { kind: 'missing' };
		const content = await this.app.vault.cachedRead(file);
		const body = content.slice(getFrontMatterInfo(content).contentStart);
		return { kind: 'found', briefing: briefingFromNote(path, await frontmatterOf(this.app, file), body) };
	}
}
