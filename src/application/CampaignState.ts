import type { Area, Campaign } from '../domain';
import type { CampaignIssue } from './mergeTaskStatuses';
import type { PendingOrFailedStatus, SyncStatus } from './QuestState';

/** Immutable view of the session's campaigns; every change produces a new object. */
export interface CampaignSnapshot {
	/** Campaigns as last read from the vault, with Habitica's last known status applied; `null` before the first sync. */
	readonly campaigns: readonly Campaign[] | null;
	/** Areas as last read from the vault (ADR-017), the streaks of their reading habits applied; `null` before the first sync. */
	readonly areas: readonly Area[] | null;
	/** Tasks and habits, of campaigns and areas, whose Habitica task is gone. */
	readonly issues: readonly CampaignIssue[];
	/** When Habitica last answered, or `null` before the first time. */
	readonly lastSyncedAt: Date | null;
	readonly status: SyncStatus;
}

/** One read of the vault with Habitica's last known status applied: what each record stores. */
export interface CampaignLists {
	readonly campaigns: readonly Campaign[];
	readonly areas: readonly Area[];
	readonly issues: readonly CampaignIssue[];
}

const INITIAL: CampaignSnapshot = { campaigns: null, areas: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } };

/** Session-scoped campaign state, held in memory only and never written to disk (D3). */
export class CampaignState {
	private current: CampaignSnapshot = INITIAL;

	snapshot(): CampaignSnapshot {
		return this.current;
	}

	/** Stores fresh lists and marks them `synced`. */
	recordSuccess(lists: CampaignLists, syncedAt: Date): void {
		this.current = { ...copy(lists), lastSyncedAt: syncedAt, status: { kind: 'synced' } };
	}

	/** Fresh lists from the vault alone: the status and the sync time stay as they were. */
	recordVault(lists: CampaignLists): void {
		this.current = { ...this.current, ...copy(lists) };
	}

	/** The vault lists are fresh but Habitica did not answer: keeps the last sync time. */
	recordPartial(lists: CampaignLists, status: PendingOrFailedStatus): void {
		this.current = { ...this.current, ...copy(lists), status };
	}

	/** Changes only the status; the lists and the sync time stay untouched. */
	setStatus(status: PendingOrFailedStatus): void {
		this.current = { ...this.current, status };
	}
}

function copy({ campaigns, areas, issues }: CampaignLists): Pick<CampaignSnapshot, 'campaigns' | 'areas' | 'issues'> {
	return { campaigns: [...campaigns], areas: [...areas], issues: [...issues] };
}
