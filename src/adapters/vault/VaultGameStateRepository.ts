import { normalizePath, type App } from 'obsidian';
import type { CharacterLoadResult, CharacterProjection, CharacterSaveResult, GameStateRepository, RulesRepository, TitleSaveResult } from '../../ports';
import { waitForCache } from './cacheWait';
import { characterFromFrontmatter } from './characterMapper';
import { writeCharacterTitle } from './characterTitle';
import { characterNotePath, normalizeVaultFolder } from './folderPath';
import { applyCharacterProjection, characterProjectionChanged, newCharacterNote } from './projections';
import { frontmatterOf, onCacheChanged } from './vaultFrontmatter';

/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Game state read from the vault (S1). `Character.md` is read with `metadataCache`; `saveCharacter`
 * sets the derived fields through `processFrontMatter`, `saveTitle` the chosen title (ADR-020), and a
 * rebuild can create the note again.
 */
export class VaultGameStateRepository implements GameStateRepository {
	/** `vaultFolder` is read on every load, so a settings change applies without rewiring. */
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		private readonly vaultFolder: () => string,
		/** The character curve decides the level the note shows. */
		private readonly rules: RulesRepository,
	) {}

	async loadCharacter(): Promise<CharacterLoadResult> {
		const path = normalizePath(characterNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { kind: 'missing', path };
		const { rules } = await this.rules.load();
		return { kind: 'found', character: characterFromFrontmatter(await frontmatterOf(this.app, file), rules.characterCurve) };
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

	/** The chosen title (titles S2, ADR-020): `title` alone, through `processFrontMatter`; the projection's rewrite above keeps it. */
	saveTitle(title: string): Promise<TitleSaveResult> {
		return writeCharacterTitle(this.app, normalizePath(characterNotePath(this.vaultFolder())), title);
	}

	async createCharacter(projection: CharacterProjection, created: string): Promise<void> {
		const folder = normalizePath(normalizeVaultFolder(this.vaultFolder()));
		if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
		await this.app.vault.create(normalizePath(characterNotePath(this.vaultFolder())), newCharacterNote(projection, created));
	}
}
