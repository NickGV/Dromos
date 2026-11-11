import { carriesTag, isOfferReward, KAIROS_TAG, lastPurchases, openOffers, tagIdsNamed, type Offer, type PurseEntry, type Reward } from '../domain';
import type { Clock, DeviceStore, GoldAccount, OfferRepository, PurseRepository, RewardCatalog, TagCatalog, UnreadableNoteRow } from '../ports';
import { pendingOfferRows, writePendingOfferRows } from './pendingOfferRows';
import { statusForFailure, type FailedStatus } from './statusForFailure';

/** Why the shop has nothing to sell, or `ready`. Offline or without credentials nothing can be bought (M10 S1). */
export type ShopStatus = { readonly kind: 'ready' } | { readonly kind: 'not-configured' } | FailedStatus;

/** The shop as one read found it (M10 S1). */
export interface ShopSnapshot {
	readonly status: ShopStatus;
	/** Habitica's gold, `null` when it could not be read. */
	readonly gold: number | null;
	/** The user's own Habitica rewards, never an offer's nor one Kairos owns; `null` when they could not be read. */
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
	/** Where the `kairos` tag is found, to leave out the rewards Kairos owns (L13). */
	readonly tags: Pick<TagCatalog, 'listTags'>;
	/** The purse in the vault, for the last purchases and the offers bought (M10 S3). */
	readonly purse: PurseRepository;
	/** Esdras's offers, `Shop.md` (M10 S2). */
	readonly offers: OfferRepository;
	/** Today's local date: an offer's last day is inclusive. */
	readonly clock: Clock;
	/** This device's store: the rows of offers bought that the purse could not keep yet (L8). */
	readonly store: DeviceStore;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Reads the shop (M10 S1) when its screen opens and on Sync, never on a timer: the gold, then the
 * rewards, one after the other so a failure spends no further request. Without credentials it asks
 * Habitica nothing. The rewards of Esdras's offers (alias `dromos-offer-…`) are never listed as
 * the user's own, nor the ones carrying the tag `kairos` (L13), which Kairos buys itself: when some
 * reward carries a tag, the tags are read in the same load; when they cannot be, every reward shows. Esdras's open offers and the last purchases come from the vault, whatever Habitica
 * answers; a note that cannot be read shows none. The rows of offers bought that the purse could not
 * keep are written now when it can; until then those offers stay off sale (L8). Never rejects.
 */
export class LoadShop {
	constructor(private readonly deps: LoadShopDeps) {}

	async execute(): Promise<ShopSnapshot> {
		const [habitica, purse, offers] = await Promise.all([this.readHabitica(), this.readPurse(), this.readOffers()]);
		const { store, clock } = this.deps;
		const entries = purse.read ? [...purse.entries, ...(await writePendingOfferRows(store, this.deps.purse, purse.entries))] : purse.entries;
		return {
			...habitica,
			purchases: lastPurchases(entries, LAST_PURCHASES),
			purseUnreadable: purse.unreadable,
			offers: openOffers(offers.offers, [...entries, ...pendingOfferRows(store)], clock.today()),
			offersUnreadable: offers.unreadable,
		};
	}

	private async readHabitica(): Promise<Pick<ShopSnapshot, 'status' | 'gold' | 'rewards'>> {
		const { gold, rewards, hasCredentials } = this.deps;
		if (!hasCredentials()) return { status: { kind: 'not-configured' }, gold: null, rewards: null };
		try {
			const current = await gold.readGold();
			const listed = (await rewards.list()).filter((reward) => !isOfferReward(reward));
			return { status: { kind: 'ready' }, gold: current, rewards: await this.withoutKairos(listed) };
		} catch (error) {
			return { status: statusForFailure(error), gold: null, rewards: null };
		}
	}

	/** The purse's rows; `read` is false when it could not be read, and then nothing is written into it. */
	/** `rewards` without the ones tagged `kairos`; all of them when none carries a tag, or the tags cannot be read. */
	private async withoutKairos(rewards: readonly Reward[]): Promise<readonly Reward[]> {
		if (!rewards.some((reward) => reward.tags.length > 0)) return rewards;
		try {
			const kairos = tagIdsNamed(await this.deps.tags.listTags(), KAIROS_TAG);
			return rewards.filter((reward) => !carriesTag(reward, kairos));
		} catch {
			// Showing a reward Kairos owns costs at most a confirmed purchase; hiding every reward would empty the Shop.
			return rewards;
		}
	}

	private async readPurse(): Promise<{ readonly read: boolean; readonly entries: readonly PurseEntry[]; readonly unreadable: readonly UnreadableNoteRow[] }> {
		try {
			return { read: true, ...(await this.deps.purse.read()) };
		} catch {
			return { read: false, entries: [], unreadable: [] };
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
