import { boughtOffers, canAfford, offerAlias, type Offer, type PurseEntry, type Reward } from '../domain';
import type { Clock, DeviceStore, GoldAccount, PurseRepository, RewardCatalog } from '../ports';
import { PurchaseLock, recordInPurse, refusal, type PurchasedItem, type PurchaseOutcome } from './BuyReward';
import { pendingOfferRows, rememberOfferRow } from './pendingOfferRows';
import { statusForFailure } from './statusForFailure';

export interface BuyOfferDeps {
	readonly rewards: RewardCatalog;
	readonly gold: GoldAccount;
	/** Where the purchase is written with the offer's `id`, which takes the offer off sale (M10 S3). */
	readonly purse: PurseRepository;
	readonly clock: Clock;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
	/** This device's store, where the row of an offer bought waits while the purse cannot keep it (L8). */
	readonly store: DeviceStore;
}

/**
 * Buys one of Esdras's offers (M10 S2, ADR-019), once the screen has had the purchase confirmed.
 * Habitica keeps a bought reward, so each offer gets its own reward, alias `dromos-offer-<id>`:
 * looked up first and created only when it does not exist, so a retry never creates a second one
 * (one whose price is not the offer's is replaced, so the gold taken is the price confirmed). It is
 * bought, the purchase is written into the purse with the offer's `id`, and the reward is deleted.
 * A reward left by a failed delete is never listed as the user's own. An offer the purse already
 * holds, or dearer than the gold shown, asks Habitica nothing, and so does one whose purchase cannot
 * be told because the purse cannot be read. When the purse cannot keep the row, this device keeps it
 * until it can, and the offer is not bought again meanwhile (L8). One purchase runs at a time. Never
 * rejects.
 */
export class BuyOffer {
	private readonly lock = new PurchaseLock();

	constructor(private readonly deps: BuyOfferDeps) {}

	execute(offer: Offer, gold: number): Promise<PurchaseOutcome> {
		return this.lock.run(() => this.buy(offer, gold));
	}

	private async buy(offer: Offer, gold: number): Promise<PurchaseOutcome> {
		const { rewards, purse, clock, hasCredentials, store } = this.deps;
		const item: PurchasedItem = { name: offer.offer, price: offer.price };
		if (!hasCredentials()) return { kind: 'not-configured' };
		if (!canAfford(gold, offer.price)) return { kind: 'too-dear', item, gold };
		let entries: readonly PurseEntry[];
		try {
			entries = (await purse.read()).entries;
		} catch {
			return { kind: 'purse-unreadable', item };
		}
		if (boughtOffers([...entries, ...pendingOfferRows(store)]).has(offer.id)) return { kind: 'already-bought', item };

		let reward: Reward;
		try {
			reward = await this.rewardFor(offer);
		} catch (error) {
			return { kind: 'failed', item, status: statusForFailure(error) };
		}
		let after: number | null;
		try {
			after = await rewards.buy(reward.id);
		} catch (error) {
			// The reward stays in Habitica, hidden from the user's own, for the retry to buy.
			return refusal(error, item, this.deps.gold);
		}
		const entry: PurseEntry = { date: clock.today(), kind: 'purchase', what: offer.offer, gold: -offer.price, level: null, offer: offer.id };
		const recorded = await recordInPurse(purse, entry);
		if (!recorded) rememberOfferRow(store, entry);
		await rewards.remove(reward.id).catch(() => undefined);
		return { kind: 'bought', item, gold: after, recorded, entry };
	}

	/** The offer's reward: the one a failed attempt left, when its price is the offer's, else a new one. */
	private async rewardFor(offer: Offer): Promise<Reward> {
		const { rewards } = this.deps;
		const alias = offerAlias(offer.id);
		const found = await rewards.findByAlias(alias);
		if (found && found.price === offer.price) return found;
		if (found) await rewards.remove(found.id);
		return rewards.create({ name: offer.offer, notes: offer.why ?? '', price: offer.price, alias });
	}
}
