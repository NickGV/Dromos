import { normalizePath, type App } from 'obsidian';
import { DEFAULT_RULES } from '../../domain';
import type { RulesLoadResult, RulesRepository } from '../../ports';
import { rulesNotePath } from './folderPath';
import { rulesFromFrontmatter } from './rulesMapper';
import { frontmatterOf } from './vaultFrontmatter';

/** `Rules.md`, read on every load so an edit applies on the next sync. Dromos never writes it. */
export class VaultRulesRepository implements RulesRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache'>,
		private readonly vaultFolder: () => string,
	) {}

	async load(): Promise<RulesLoadResult> {
		const path = normalizePath(rulesNotePath(this.vaultFolder()));
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { rules: DEFAULT_RULES, invalid: null };
		const { rules, invalidFields } = rulesFromFrontmatter(await frontmatterOf(this.app, file));
		return { rules, invalid: invalidFields.length > 0 ? { path, fields: invalidFields } : null };
	}
}
