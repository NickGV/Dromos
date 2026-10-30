import type { Quest } from '../domain';

/**
 * Where the last sync left the quest list. `not-configured` means the Habitica
 * user ID or token is empty, so no request was made.
 */
export type SyncStatus =
	| { readonly kind: 'idle' }
	| { readonly kind: 'syncing' }
	| { readonly kind: 'synced' }
	| { readonly kind: 'not-configured' }
	| { readonly kind: 'offline' }
	| { readonly kind: 'unauthorized' }
	| { readonly kind: 'rate-limited'; readonly retryAfterSeconds: number | null }
	| { readonly kind: 'error' };

export type SyncStatusKind = SyncStatus['kind'];

/** Statuses that do not come with a fresh quest list. */
export type PendingOrFailedStatus = Exclude<SyncStatus, { readonly kind: 'idle' | 'synced' }>;

/** Immutable view of the session's quests; every change produces a new object. */
export interface QuestSnapshot {
	/** Quests from the last successful sync, or `null` before the first one. */
	readonly quests: readonly Quest[] | null;
	/** When the last successful sync finished, or `null` before the first one. */
	readonly lastSyncedAt: Date | null;
	readonly status: SyncStatus;
}

const INITIAL: QuestSnapshot = { quests: null, lastSyncedAt: null, status: { kind: 'idle' } };

/** Session-scoped quest state, held in memory only and never written to disk (D3). */
export class QuestState {
	private current: QuestSnapshot = INITIAL;

	snapshot(): QuestSnapshot {
		return this.current;
	}

	/** Stores a fresh quest list and marks it `synced`. */
	recordSuccess(quests: readonly Quest[], syncedAt: Date): void {
		this.current = { quests: [...quests], lastSyncedAt: syncedAt, status: { kind: 'synced' } };
	}

	/** Changes only the status; the last quests and sync time stay untouched. */
	setStatus(status: PendingOrFailedStatus): void {
		this.current = { ...this.current, status };
	}
}
