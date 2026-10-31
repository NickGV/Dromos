import type { App } from 'obsidian';
import type { Campaign } from '../../domain';
import type { CampaignRepository } from '../../ports';
import { SystemClock } from '../obsidian/SystemClock';
import { buildActiveCampaigns, type VaultNote } from './campaignMapper';

/** Note types `listActive` needs: the campaigns themselves and the sessions of a research. */
const RELEVANT_TYPES: readonly unknown[] = ['index', 'research', 'study-session'];

/**
 * Campaigns read from the vault with `metadataCache` (S2). Read-only: it never
 * writes a note. Notes without a cache entry yet (right after Obsidian starts)
 * are skipped; the next sync sees them.
 */
export class VaultCampaignRepository implements CampaignRepository {
	constructor(private readonly app: Pick<App, 'vault' | 'metadataCache'>) {}

	listActive(): Promise<readonly Campaign[]> {
		return Promise.resolve(buildActiveCampaigns(this.notes()));
	}

	private notes(): VaultNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const frontmatter: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const type = typeof frontmatter === 'object' && frontmatter !== null ? (frontmatter as Record<string, unknown>).type : undefined;
			if (!RELEVANT_TYPES.includes(type)) return [];
			return [{ path: file.path, frontmatter, createdOn: new SystemClock(() => new Date(file.stat.ctime)).today() }];
		});
	}
}
