import { TaskSourceError } from '../ports';
import type { SyncStatus } from './QuestState';

/** The statuses a failed Habitica request maps to. */
export type FailedStatus = Extract<SyncStatus, { readonly kind: 'offline' | 'unauthorized' | 'rate-limited' | 'error' }>;

/** Maps a failed fetch to the status the banner shows; anything untyped is `error`. */
export function statusForFailure(error: unknown): FailedStatus {
	if (!(error instanceof TaskSourceError)) return { kind: 'error' };
	switch (error.kind) {
		case 'Offline':
			return { kind: 'offline' };
		case 'Unauthorized':
			return { kind: 'unauthorized' };
		case 'RateLimited':
			return { kind: 'rate-limited', retryAfterSeconds: error.retryAfterSeconds };
		case 'Unknown':
			return { kind: 'error' };
	}
}
