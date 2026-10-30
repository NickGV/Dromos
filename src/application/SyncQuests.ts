import { TaskSourceError, type Clock, type TaskSource } from '../ports';
import type { PendingOrFailedStatus, QuestSnapshot, QuestState } from './QuestState';

export interface SyncQuestsDeps {
	readonly source: TaskSource;
	readonly clock: Clock;
	readonly state: QuestState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Fetches today's quests once and records the outcome in the quest state (D1).
 * A failure keeps the last quests and sync time (D3). Never rejects.
 */
export class SyncQuests {
	private inFlight: Promise<QuestSnapshot> | null = null;

	constructor(private readonly deps: SyncQuestsDeps) {}

	/**
	 * Runs one sync, or returns the one already running. The state reads `syncing`
	 * as soon as this returns, so a caller can render it before awaiting.
	 */
	execute(): Promise<QuestSnapshot> {
		this.inFlight ??= this.run().finally(() => {
			this.inFlight = null;
		});
		return this.inFlight;
	}

	private async run(): Promise<QuestSnapshot> {
		const { source, clock, state, hasCredentials } = this.deps;
		try {
			if (!hasCredentials()) {
				state.setStatus({ kind: 'not-configured' });
				return state.snapshot();
			}
			state.setStatus({ kind: 'syncing' });
			const quests = await source.fetchToday();
			state.recordSuccess(quests, clock.now());
		} catch (error) {
			state.setStatus(statusForFailure(error));
		}
		return state.snapshot();
	}
}

/** Maps a failed fetch to the status the banner shows; anything untyped is `error`. */
function statusForFailure(error: unknown): PendingOrFailedStatus {
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
