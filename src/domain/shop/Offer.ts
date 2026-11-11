import type { PurseEntry } from './Purse';
import type { Reward } from './Reward';

/**
 * One of Esdras's offers (M10 S2, ADR-019): a row of `<Dromos folder>/Shop.md`, which only Esdras
 * writes. Each `id` is used once and never again, so each offer is bought once.
 */
export interface Offer {
	/** Lowercase letters, digits and hyphens, unique and never reused. */
	readonly id: string;
	/** What is offered. */
	readonly offer: string;
	/** Whole gold above 0. */
	readonly price: number;
	/** Why Esdras offers it, or `null` when he did not say. */
	readonly why: string | null;
	/** The last day it is offered, inclusive, as a local `YYYY-MM-DD`; `null` when it has none. */
	readonly until: string | null;
}

/** The start of the alias of every Habitica reward an offer's purchase creates. */
export const OFFER_ALIAS_PREFIX = 'dromos-offer-';

const OFFER_ID = /^[a-z0-9-]+$/;

/** Whether `id` can name an offer: lowercase letters, digits and hyphens only. */
export function isOfferId(id: string): boolean {
	return OFFER_ID.test(id);
}

/** The Habitica alias of the reward that buys offer `id`, `dromos-offer-<id>`: looked up first, so a retry never makes a second one. */
export function offerAlias(id: string): string {
	return `${OFFER_ALIAS_PREFIX}${id}`;
}

/** Whether a Habitica reward is an offer's, never one of the user's own, even when its delete failed. */
export function isOfferReward(reward: Pick<Reward, 'alias'>): boolean {
	return reward.alias?.startsWith(OFFER_ALIAS_PREFIX) ?? false;
}

/** The ids of the offers the purse holds a purchase of. */
export function boughtOffers(entries: readonly PurseEntry[]): Set<string> {
	return new Set(entries.flatMap((entry) => (entry.kind === 'purchase' && entry.offer !== null ? [entry.offer] : [])));
}

/** The offers on sale on `today`: not bought, and with no last day or one not yet past. Expired and bought ones are only hidden. */
export function openOffers(offers: readonly Offer[], entries: readonly PurseEntry[], today: string): Offer[] {
	const bought = boughtOffers(entries);
	return offers.filter((offer) => !bought.has(offer.id) && (offer.until === null || offer.until >= today));
}
