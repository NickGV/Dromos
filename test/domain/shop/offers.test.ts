import { describe, expect, it } from 'vitest';
import { boughtOffers, isOfferId, isOfferReward, offerAlias, openOffers, type Offer, type PurseEntry } from '../../../src/domain';

const offer = (id: string, until: string | null = null): Offer => ({ id, offer: `Offer ${id}`, price: 30, why: null, until });
const bought = (id: string): PurseEntry => ({ date: '2026-11-05', kind: 'purchase', what: `Offer ${id}`, gold: -30, level: null, offer: id });

describe('Esdras offers (M10 S2)', () => {
	it('names an offer id with lowercase letters, digits and hyphens only', () => {
		expect(['book-week', 'a1', '2026-walk'].every(isOfferId)).toBe(true);
		expect(['Book', 'book_week', 'book week', '', 'café'].some(isOfferId)).toBe(false);
	});

	it("gives an offer's Habitica reward the alias dromos-offer-<id>, and knows such a reward is not the user's own", () => {
		expect(offerAlias('book-week')).toBe('dromos-offer-book-week');
		expect(isOfferReward({ alias: 'dromos-offer-book-week' })).toBe(true);
		expect(isOfferReward({ alias: 'coffee' })).toBe(false);
		expect(isOfferReward({ alias: null })).toBe(false);
	});

	it('knows the offers the purse says were bought', () => {
		expect([...boughtOffers([bought('a'), { date: '2026-11-05', kind: 'bonus', what: 'Level 3', gold: 30, level: 3, offer: null }])]).toEqual(['a']);
	});

	it('shows the offers not bought whose last day is today or later, or that have none, in order', () => {
		const offers = [offer('gone', '2026-11-10'), offer('today', '2026-11-11'), offer('later', '2026-12-01'), offer('always'), offer('done', '2026-12-01')];

		expect(openOffers(offers, [bought('done')], '2026-11-11').map((entry) => entry.id)).toEqual(['today', 'later', 'always']);
	});
});
