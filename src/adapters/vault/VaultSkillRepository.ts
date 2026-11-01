import { normalizePath, type App } from 'obsidian';
import type { SkillLoadResult, SkillProjection, SkillRepository } from '../../ports';
import { waitForCache } from './cacheWait';
import { skillNotePath, skillsFolderPath } from './folderPath';
import { applySkillProjection, skillProjectionChanged } from './projections';
import { buildSkills } from './skillMapper';
import { frontmatterOf, onCacheChanged } from './vaultFrontmatter';

/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * The skills of `Dromos/Skills/`, read with `metadataCache`. The only write is
 * `writeProjection`: the unlock and the standing of one skill, through `processFrontMatter`.
 */
export class VaultSkillRepository implements SkillRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		private readonly vaultFolder: () => string,
	) {}

	async list(): Promise<SkillLoadResult> {
		const folder = normalizePath(skillsFolderPath(this.vaultFolder()));
		const notes = await Promise.all(
			this.app.vault
				.getMarkdownFiles()
				.filter((file) => file.parent?.path === folder)
				.map(async (file) => ({ path: file.path, frontmatter: await frontmatterOf(this.app, file) })),
		);
		return buildSkills(notes);
	}

	async writeProjection(skillId: string, projection: SkillProjection): Promise<boolean> {
		const file = this.app.vault.getFileByPath(normalizePath(skillNotePath(this.vaultFolder(), skillId)));
		if (!file) return false;
		if (!skillProjectionChanged(await frontmatterOf(this.app, file), projection)) return false;

		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => applySkillProjection(frontmatter, projection));
		await waitForCache(
			onCacheChanged(this.app),
			file.path,
			() => !skillProjectionChanged(this.app.metadataCache.getFileCache(file)?.frontmatter, projection),
			CACHE_WAIT_MS,
		);
		return true;
	}
}
