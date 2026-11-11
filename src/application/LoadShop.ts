import type { Reward } from '../domain';
import type { GoldAccount, RewardCatalog } from '../ports';
import { statusForFailure, type FailedStatus } from './statusForFailure';

/** Why the shop has nothing to sell, or `ready`. Offline or without credentials nothing can be bought (M10 S1). */
export type ShopStatus = { readonly kind: 'ready' } | { readonly kind: 'not-configured' } | FailedStatus;

/** The shop as one read found it (M10 S1). */
export interface ShopSnapshot {
	readonly status: ShopStatus;
	/** Habitica's gold, `null` when it could not be read. */
	readonly gold: number | null;
	/** The user's own Habitica rewards, `null` when they could not be read. */
	readonly rewards: readonly Reward[] | null;
}

export interface LoadShopDeps {
	readonly gold: GoldAccount;
	readonly rewards: RewardCatalog;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the shop (M10 S1) when its screen opens and on Sync, never on a timer: the gold, then the
 * rewards, one after the other so a failure spends no further request. Without credentials it asks
 * Habitica nothing. Never rejects.
 */
export class LoadShop {
	constructor(private readonly deps: LoadShopDeps) {}

	async execute(): Promise<ShopSnapshot> {
		const { gold, rewards, hasCredentials } = this.deps;
		if (!hasCredentials()) return { status: { kind: 'not-configured' }, gold: null, rewards: null };
		try {
			const current = await gold.readGold();
			const listed = await rewards.list();
			return { status: { kind: 'ready' }, gold: current, rewards: listed };
		} catch (error) {
			return { status: statusForFailure(error), gold: null, rewards: null };
		}
	}
}
