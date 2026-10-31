import { TaskSourceError } from '../ports';
import type { PendingOrFailedStatus } from './QuestState';

/** Maps a failed fetch to the status the banner shows; anything untyped is `error`. */
export function statusForFailure(error: unknown): PendingOrFailedStatus {
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
