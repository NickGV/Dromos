import type { Campaign } from '../domain';
import type { CampaignIssue } from './mergeTaskStatuses';
import type { PendingOrFailedStatus, SyncStatus } from './QuestState';

/** Immutable view of the session's campaigns; every change produces a new object. */
export interface CampaignSnapshot {
	/** Campaigns as last read from the vault, with Habitica's last known status applied; `null` before the first sync. */
	readonly campaigns: readonly Campaign[] | null;
	/** Tasks whose Habitica task is gone. */
	readonly issues: readonly CampaignIssue[];
	/** When Habitica last answered, or `null` before the first time. */
	readonly lastSyncedAt: Date | null;
	readonly status: SyncStatus;
}

const INITIAL: CampaignSnapshot = { campaigns: null, issues: [], lastSyncedAt: null, status: { kind: 'idle' } };

/** Session-scoped campaign state, held in memory only and never written to disk (D3). */
export class CampaignState {
	private current: CampaignSnapshot = INITIAL;

	snapshot(): CampaignSnapshot {
		return this.current;
	}

	/** Stores a fresh list and marks it `synced`. */
	recordSuccess(campaigns: readonly Campaign[], issues: readonly CampaignIssue[], syncedAt: Date): void {
		this.current = { campaigns: [...campaigns], issues: [...issues], lastSyncedAt: syncedAt, status: { kind: 'synced' } };
	}

	/** A fresh list from the vault alone: the status and the sync time stay as they were. */
	recordVault(campaigns: readonly Campaign[], issues: readonly CampaignIssue[]): void {
		this.current = { ...this.current, campaigns: [...campaigns], issues: [...issues] };
	}

	/** The vault list is fresh but Habitica did not answer: keeps the last sync time. */
	recordPartial(campaigns: readonly Campaign[], issues: readonly CampaignIssue[], status: PendingOrFailedStatus): void {
		this.current = { ...this.current, campaigns: [...campaigns], issues: [...issues], status };
	}

	/** Changes only the status; the list and the sync time stay untouched. */
	setStatus(status: PendingOrFailedStatus): void {
		this.current = { ...this.current, status };
	}
}
