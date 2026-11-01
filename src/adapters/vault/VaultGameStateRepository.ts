import { normalizePath, type App } from 'obsidian';
import type { CharacterLoadResult, CharacterProjection, CharacterSaveResult, GameStateRepository } from '../../ports';
import { waitForCache } from './cacheWait';
import { characterFromFrontmatter } from './characterMapper';
import { characterNotePath } from './folderPath';
import { applyCharacterProjection, characterProjectionChanged } from './projections';
import { frontmatterOf, onCacheChanged } from './vaultFrontmatter';

/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Game state read from the vault (S1). `Character.md` is read with `metadataCache`; the
 * only write is `saveCharacter`, which sets the derived fields through `processFrontMatter`.
 */
export class VaultGameStateRepository implements GameStateRepository {
	/** `vaultFolder` is read on every load, so a settings change applies without rewiring. */
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		private readonly vaultFolder: () => string,
	) {}

	async loadCharacter(): Promise<CharacterLoadResult> {
		const path = normalizePath(characterNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { kind: 'missing', path };
		return { kind: 'found', character: characterFromFrontmatter(await frontmatterOf(this.app, file)) };
	}

	async saveCharacter(projection: CharacterProjection): Promise<CharacterSaveResult> {
		const file = this.app.vault.getFileByPath(normalizePath(characterNotePath(this.vaultFolder())));
		if (!file) return 'missing';
		if (!characterProjectionChanged(await frontmatterOf(this.app, file), projection)) return 'unchanged';

		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => applyCharacterProjection(frontmatter, projection));
		await waitForCache(
			onCacheChanged(this.app),
			file.path,
			() => !characterProjectionChanged(this.app.metadataCache.getFileCache(file)?.frontmatter, projection),
			CACHE_WAIT_MS,
		);
		return 'saved';
	}
}
