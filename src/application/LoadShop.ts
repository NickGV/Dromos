import { isOfferReward, lastPurchases, openOffers, type Offer, type PurseEntry, type Reward } from '../domain';
import type { Clock, GoldAccount, OfferRepository, PurseRepository, RewardCatalog, UnreadableNoteRow } from '../ports';
import { statusForFailure, type FailedStatus } from './statusForFailure';

/** Why the shop has nothing to sell, or `ready`. Offline or without credentials nothing can be bought (M10 S1). */
export type ShopStatus = { readonly kind: 'ready' } | { readonly kind: 'not-configured' } | FailedStatus;

/** The shop as one read found it (M10 S1). */
export interface ShopSnapshot {
	readonly status: ShopStatus;
	/** Habitica's gold, `null` when it could not be read. */
	readonly gold: number | null;
	/** The user's own Habitica rewards, never an offer's; `null` when they could not be read. */
	readonly rewards: readonly Reward[] | null;
	/** Esdras's open offers (M10 S2): not bought, not past their last day; read from the vault, so offline too. */
	readonly offers: readonly Offer[];
	/** The rows of `Shop.md` that could not be read. */
	readonly offersUnreadable: readonly UnreadableNoteRow[];
	/** The last purchases of the purse, newest first (M10 S4); read from the vault, so offline too. */
	readonly purchases: readonly PurseEntry[];
	/** The rows of the purse that could not be read. */
	readonly purseUnreadable: readonly UnreadableNoteRow[];
}

/** How many purchases the Shop lists. */
const LAST_PURCHASES = 5;

export interface LoadShopDeps {
	readonly gold: GoldAccount;
	readonly rewards: RewardCatalog;
	/** The purse in the vault, for the last purchases and the offers bought (M10 S3). */
	readonly purse: PurseRepository;
	/** Esdras's offers, `Shop.md` (M10 S2). */
	readonly offers: OfferRepository;
	/** Today's local date: an offer's last day is inclusive. */
	readonly clock: Clock;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the shop (M10 S1) when its screen opens and on Sync, never on a timer: the gold, then the
 * rewards, one after the other so a failure spends no further request. Without credentials it asks
 * Habitica nothing. The rewards of Esdras's offers (alias `dromos-offer-…`) are never listed as
 * the user's own. Esdras's open offers and the last purchases come from the vault, whatever Habitica
 * answers; a note that cannot be read shows none. Never rejects.
 */
export class LoadShop {
	constructor(private readonly deps: LoadShopDeps) {}

	async execute(): Promise<ShopSnapshot> {
		const [habitica, purse, offers] = await Promise.all([this.readHabitica(), this.readPurse(), this.readOffers()]);
		return {
			...habitica,
			purchases: lastPurchases(purse.entries, LAST_PURCHASES),
			purseUnreadable: purse.unreadable,
			offers: openOffers(offers.offers, purse.entries, this.deps.clock.today()),
			offersUnreadable: offers.unreadable,
		};
	}

	private async readHabitica(): Promise<Pick<ShopSnapshot, 'status' | 'gold' | 'rewards'>> {
		const { gold, rewards, hasCredentials } = this.deps;
		if (!hasCredentials()) return { status: { kind: 'not-configured' }, gold: null, rewards: null };
		try {
			const current = await gold.readGold();
			const listed = (await rewards.list()).filter((reward) => !isOfferReward(reward));
			return { status: { kind: 'ready' }, gold: current, rewards: listed };
		} catch (error) {
			return { status: statusForFailure(error), gold: null, rewards: null };
		}
	}

	private async readPurse(): Promise<{ readonly entries: readonly PurseEntry[]; readonly unreadable: readonly UnreadableNoteRow[] }> {
		try {
			return await this.deps.purse.read();
		} catch {
			return { entries: [], unreadable: [] };
		}
	}

	private async readOffers(): Promise<{ readonly offers: readonly Offer[]; readonly unreadable: readonly UnreadableNoteRow[] }> {
		try {
			return await this.deps.offers.load();
		} catch {
			return { offers: [], unreadable: [] };
		}
	}
}
