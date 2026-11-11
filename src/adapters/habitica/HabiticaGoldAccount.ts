import { TaskSourceError, type GoldAccount } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';

/** Only the stats: the gold is `stats.gp`, and the rest of the user is not needed. */
const USER_STATS_PATH = '/user?userFields=stats';

/**
 * The user's Habitica gold (M10, ADR-019), read with `GET /user?userFields=stats`. Rejects only
 * with `TaskSourceError`, whose messages never carry the credentials.
 */
export class HabiticaGoldAccount implements GoldAccount {
	constructor(private readonly client: HabiticaClient) {}

	async readGold(): Promise<number> {
		try {
			const gold = goldOf(await this.client.get(USER_STATS_PATH));
			if (gold === null) throw new TaskSourceError('Unknown', null, 'Habitica sent no gold');
			return gold;
		} catch (error) {
			throw typed(error, 'Habitica gold could not be read');
		}
	}
}

/** `stats.gp` of a user, or `null` when it is not a finite number. */
export function goldOf(user: unknown): number | null {
	const stats = typeof user === 'object' && user !== null ? (user as Record<string, unknown>).stats : undefined;
	return gpOf(stats);
}

/** `gp` of a stats object (the answer of scoring a task is one), or `null` when it is not a finite number. */
export function gpOf(stats: unknown): number | null {
	const gp = typeof stats === 'object' && stats !== null ? (stats as Record<string, unknown>).gp : undefined;
	return typeof gp === 'number' && Number.isFinite(gp) ? gp : null;
}

/** A `TaskSourceError` as it is; anything else replaced, not wrapped: its message may carry credentials. */
export function typed(error: unknown, message: string): TaskSourceError {
	return error instanceof TaskSourceError ? error : new TaskSourceError('Unknown', null, message);
}
