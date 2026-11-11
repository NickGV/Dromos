import { lastPurchases, type PurseEntry, type Reward } from '../domain';
import type { GoldAccount, PurseRepository, RewardCatalog, UnreadablePurseLine } from '../ports';
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
	/** The last purchases of the purse, newest first (M10 S4); read from the vault, so offline too. */
	readonly purchases: readonly PurseEntry[];
	/** The rows of the purse that could not be read. */
	readonly purseUnreadable: readonly UnreadablePurseLine[];
}

/** How many purchases the Shop lists. */
const LAST_PURCHASES = 5;

export interface LoadShopDeps {
	readonly gold: GoldAccount;
	readonly rewards: RewardCatalog;
	/** The purse in the vault, for the last purchases (M10 S3). */
	readonly purse: PurseRepository;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the shop (M10 S1) when its screen opens and on Sync, never on a timer: the gold, then the
 * rewards, one after the other so a failure spends no further request. Without credentials it asks
 * Habitica nothing. The last purchases come from the purse in the vault, whatever Habitica answers;
 * a purse that cannot be read shows none. Never rejects.
 */
export class LoadShop {
	constructor(private readonly deps: LoadShopDeps) {}

	async execute(): Promise<ShopSnapshot> {
		const [habitica, purse] = await Promise.all([this.readHabitica(), this.readPurse()]);
		return { ...habitica, ...purse };
	}

	private async readHabitica(): Promise<Pick<ShopSnapshot, 'status' | 'gold' | 'rewards'>> {
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

	private async readPurse(): Promise<Pick<ShopSnapshot, 'purchases' | 'purseUnreadable'>> {
		try {
			const { entries, unreadable } = await this.deps.purse.read();
			return { purchases: lastPurchases(entries, LAST_PURCHASES), purseUnreadable: unreadable };
		} catch {
			return { purchases: [], purseUnreadable: [] };
		}
	}
}
