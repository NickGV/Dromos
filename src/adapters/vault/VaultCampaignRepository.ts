import type { App, TFile } from 'obsidian';
import type { Area, Campaign } from '../../domain';
import type { AreaRepository, CampaignRepository, LinkResult } from '../../ports';
import { SystemClock } from '../obsidian/SystemClock';
import { buildAreas } from './areaMapper';
import { onCacheChanged, waitForCache, type Timers } from './cacheWait';
import { linkHabiticaIdInFrontmatter, linkHabitHabiticaIdInFrontmatter } from './campaignLink';
import { buildActiveCampaigns, buildCompletedCampaigns, linkPath, type VaultNote } from './campaignMapper';

/** Note types the lists need: the campaigns, the sessions of a research, and the areas (ADR-017). */
const RELEVANT_TYPES: readonly unknown[] = ['index', 'research', 'study-session', 'archeion'];
/** Longest wait for Obsidian to re-read a note after Dromos saved it. */
const CACHE_WAIT_MS = 3000;

/**
 * Campaigns, and the areas whose habits Dromos tracks (ADR-017), read from the vault with
 * `metadataCache` (S2). The only writes it makes are a `habitica_id`, through `processFrontMatter`.
 * Notes without a cache entry yet (right after Obsidian starts) are skipped; the next sync sees them.
 */
export class VaultCampaignRepository implements CampaignRepository, AreaRepository {
	constructor(
		private readonly app: Pick<App, 'vault' | 'metadataCache' | 'fileManager'>,
		/** The timers of the wait for the cache after a write; injectable so tests need no real clock. */
		private readonly timers?: Timers,
	) {}

	listActive(): Promise<readonly Campaign[]> {
		return Promise.resolve(buildActiveCampaigns(this.notes()));
	}

	listCompleted(): Promise<readonly Campaign[]> {
		return Promise.resolve(buildCompletedCampaigns(this.notes()));
	}

	listAreas(): Promise<readonly Area[]> {
		return Promise.resolve(buildAreas(this.notes()));
	}

	linkHabiticaId(campaignPath: string, taskTitle: string, habiticaId: string): Promise<LinkResult> {
		return this.link(campaignPath, 'tasks', habiticaId, (frontmatter) => linkHabiticaIdInFrontmatter(frontmatter, taskTitle, habiticaId));
	}

	/** A habit of a project, or of an area (ADR-017): `linkEntry` accepts both note types for habits. */
	linkHabitHabiticaId(campaignPath: string, habitTitle: string, habiticaId: string): Promise<LinkResult> {
		return this.link(campaignPath, 'habits', habiticaId, (frontmatter) => linkHabitHabiticaIdInFrontmatter(frontmatter, habitTitle, habiticaId));
	}

	private async link(
		campaignPath: string,
		key: 'tasks' | 'habits',
		habiticaId: string,
		apply: (frontmatter: Record<string, unknown>) => LinkResult,
	): Promise<LinkResult> {
		const file = this.app.vault.getFileByPath(campaignPath);
		if (!file) return 'not-found';

		let result = 'not-found' as LinkResult;
		await this.app.fileManager.processFrontMatter(file, (frontmatter: Record<string, unknown>) => {
			result = apply(frontmatter);
		});
		// Obsidian re-reads the frontmatter after saving; wait for it so the next read, which
		// decides whether the button shows again, already sees the id.
		if (result === 'linked') {
			await waitForCache(onCacheChanged(this.app), file.path, () => this.cacheHasId(file, key, habiticaId), CACHE_WAIT_MS, this.timers);
		}
		return result;
	}

	/** The note a session's `research` link points to, as Obsidian resolves it, or `null`. */
	private resolveResearch(file: TFile, frontmatter: unknown): string | null {
		const target = linkPath((frontmatter as Record<string, unknown>).research);
		return target === null ? null : (this.app.metadataCache.getFirstLinkpathDest(target, file.path)?.path ?? null);
	}

	private cacheHasId(file: TFile, key: 'tasks' | 'habits', habiticaId: string): boolean {
		const entries: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter?.[key];
		return Array.isArray(entries) && entries.some((entry: unknown) => (entry as { habitica_id?: unknown } | null)?.habitica_id === habiticaId);
	}

	private notes(): VaultNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const frontmatter: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const type = typeof frontmatter === 'object' && frontmatter !== null ? (frontmatter as Record<string, unknown>).type : undefined;
			if (!RELEVANT_TYPES.includes(type)) return [];
			const createdOn = new SystemClock(() => new Date(file.stat.ctime)).today();
			return [{ path: file.path, frontmatter, createdOn, ...(type === 'study-session' ? { researchPath: this.resolveResearch(file, frontmatter) } : {}) }];
		});
	}
}
