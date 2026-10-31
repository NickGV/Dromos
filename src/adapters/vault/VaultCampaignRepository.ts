import type { App, TFile } from 'obsidian';
import type { Campaign } from '../../domain';
import type { CampaignRepository, LinkResult } from '../../ports';
import { SystemClock } from '../obsidian/SystemClock';
import { waitForCache } from './cacheWait';
import { linkHabiticaIdInFrontmatter } from './campaignLink';
import { buildActiveCampaigns, type VaultNote } from './campaignMapper';

/** Note types `listActive` needs: the campaigns themselves and the sessions of a research. */
const RELEVANT_TYPES: readonly unknown[] = ['index', 'research', 'study-session'];
/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Campaigns read from the vault with `metadataCache` (S2). The only write it makes
 * is `linkHabiticaId`, through `processFrontMatter`. Notes without a cache entry yet
 * (right after Obsidian starts) are skipped; the next sync sees them.
 */
export class VaultCampaignRepository implements CampaignRepository {
	constructor(private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>) {}

	listActive(): Promise<readonly Campaign[]> {
		return Promise.resolve(buildActiveCampaigns(this.notes()));
	}

	async linkHabiticaId(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkResult> {
		const file = this.app.vault.getFileByPath(campaignPath);
		if (!file) return 'not-found';

		let result = 'not-found' as LinkResult;
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			result = linkHabiticaIdInFrontmatter(frontmatter, taskTitle, habiticaId);
		});
		// Obsidian re-reads the frontmatter after saving; wait for it so the next read, which
		// decides whether the button shows again, already sees the id.
		if (result === 'linked') {
			await waitForCache(
				(onChanged) => {
					const ref = this.app.metadataCache.on('changed', (changed) => onChanged(changed.path));
					return () => this.app.metadataCache.offref(ref);
				},
				file.path,
				() => this.cacheHasId(file, habiticaId),
				CACHE_WAIT_MS,
			);
		}
		return result;
	}

	private cacheHasId(file: TFile, habiticaId: string): boolean {
		const tasks: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter?.tasks;
		return Array.isArray(tasks) && tasks.some((task: unknown) => (task as { habitica_id?: unknown } | null)?.habitica_id === habiticaId);
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
