import { getFrontMatterInfo, normalizePath, parseYaml, type App, type TFile } from 'obsidian';
import type { CharacterLoadResult, GameStateRepository } from '../../ports';
import { characterFromFrontmatter } from './characterMapper';
import { characterNotePath } from './folderPath';

/** Game state read from the vault (S1). Minimal M1 version: only `Character.md`. */
export class VaultGameStateRepository implements GameStateRepository {
	/** `vaultFolder` is read on every load, so a settings change applies without rewiring. */
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache'>,
		private readonly vaultFolder: () => string,
	) {}

	async loadCharacter(): Promise<CharacterLoadResult> {
		const path = normalizePath(characterNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { kind: 'missing', path };
		return { kind: 'found', character: characterFromFrontmatter(await this.frontmatterOf(file)) };
	}

	/**
	 * Frontmatter from `metadataCache`. Right after Obsidian starts the cache may have
	 * no entry for the note yet; then the file is read and parsed with Obsidian's own
	 * helpers instead of returning defaults. Broken YAML yields `undefined` (defaults).
	 */
	private async frontmatterOf(file: TFile): Promise<unknown> {
		const cached = this.app.metadataCache.getFileCache(file);
		if (cached) return cached.frontmatter;
		const info = getFrontMatterInfo(await this.app.vault.cachedRead(file));
		if (!info.exists) return undefined;
		try {
			return parseYaml(info.frontmatter) as unknown;
		} catch {
			return undefined;
		}
	}
}
