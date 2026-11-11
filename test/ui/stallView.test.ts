import { describe, expect, it } from 'vitest';
import type { ShopSnapshot } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { NO_CHOICE, nextTab, stallView, WARE_OBJECTS, wareObject, type StallChoice } from '../../src/ui/presenters/stallView';
import { LoadShop } from '../../src/application/LoadShop';
import { aReward, FakeHabiticaShop } from '../fakes/FakeHabiticaShop';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';
import { InMemoryOfferRepository } from '../fakes/InMemoryOfferRepository';
import { InMemoryPurseRepository } from '../fakes/InMemoryPurseRepository';

const en = createTranslator('en');
const es = createTranslator('es');

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const INSTA = aReward('r-insta', '[GT] Instagram +30 min', 3, { notes: 'Kairos offer: insta_30min' });
const BOOK = aReward('r-book', 'A new book', 175);
const BOOK_WEEK = { id: 'book-week', offer: 'A book of the week', price: 40, why: 'Five days of reading in a row', until: '2026-11-20' } as const;
const WALK = { id: 'walk', offer: 'A long walk', price: 150, why: null, until: null } as const;
const ROW = { date: '2026-11-11', kind: 'purchase', what: 'Coffee out', gold: -20, level: null, offer: null } as const;

const ready = (gold: number, rewards = [COFFEE, INSTA, BOOK], offers: ShopSnapshot['offers'] = [BOOK_WEEK, WALK]): ShopSnapshot => ({ status: { kind: 'ready' }, gold, rewards, offers, offersUnreadable: [], purchases: [ROW], purseUnreadable: [] });
const offline = (): ShopSnapshot => ({ status: { kind: 'offline' }, gold: null, rewards: null, offers: [BOOK_WEEK, WALK], offersUnreadable: [], purchases: [ROW], purseUnreadable: [] });
const choose = (tab: StallChoice['tab'], chosen: StallChoice['chosen'] = {}): StallChoice => ({ tab, chosen });

describe('wareObject: the drawing of a ware, by its price among the wares on show (M10 S6)', () => {
	it('draws the six objects from cheaper to dearer: figs, an oil lamp, a scroll, an amphora, a purple cloth, a chest', () => {
		const prices = [2, 5, 8, 12, 20, 26];

		expect(prices.map((price) => wareObject(price, prices))).toEqual(['figs', 'lamp', 'scroll', 'amphora', 'cloth', 'chest']);
		expect(WARE_OBJECTS).toEqual(['figs', 'lamp', 'scroll', 'amphora', 'cloth', 'chest']);
	});

	it('spreads more prices over the same six, never going down as the price goes up, the cheapest figs and the dearest a chest', () => {
		const prices = [2, 3, 4, 6, 8, 10, 12, 15, 18, 22, 26];
		const objects = prices.map((price) => WARE_OBJECTS.indexOf(wareObject(price, prices)));

		expect(objects[0]).toBe(0);
		expect(objects[objects.length - 1]).toBe(5);
		expect(objects).toEqual([...objects].sort((a, b) => a - b));
		expect(new Set(objects).size).toBe(6);
	});

	it('gives equal prices the same object, reading them as whole gold', () => {
		expect([10, 10.6, 30].map((price) => wareObject(price, [10, 10.6, 30]))).toEqual(['figs', 'figs', 'chest']);
	});

	it('draws the cheaper of two a basket of figs and the dearer a chest, and a lone ware a scroll', () => {
		expect([20, 175].map((price) => wareObject(price, [20, 175]))).toEqual(['figs', 'chest']);
		expect(wareObject(40, [40])).toBe('scroll');
	});
});

describe('stallView: the tiles (M10 S6)', () => {
	it('makes each reward a tile with its name, its whole price and its object, ranked among the rewards and the offers', () => {
		const tiles = stallView(ready(2386), null, NO_CHOICE, en).rewards?.tiles ?? [];

		expect(tiles.map(({ key, name, price, object }) => ({ key, name, price, object }))).toEqual([
			{ key: 'reward:r-coffee', name: 'Coffee out', price: '20', object: 'lamp' },
			{ key: 'reward:r-insta', name: '[GT] Instagram +30 min', price: '3', object: 'figs' },
			{ key: 'reward:r-book', name: 'A new book', price: '175', object: 'chest' },
		]);
		expect(stallView(ready(2386), null, NO_CHOICE, en).offers?.tiles.map(({ key, object }) => [key, object])).toEqual([
			['offer:book-week', 'amphora'],
			['offer:walk', 'cloth'],
		]);
	});

	it('names each tile by its ware, its price and whether it can be bought', () => {
		const tiles = stallView(ready(124.62), null, NO_CHOICE, en).rewards?.tiles ?? [];

		expect(tiles.map((tile) => tile.ariaLabel)).toEqual(['Coffee out, 20 gold, can be bought', '[GT] Instagram +30 min, 3 gold, can be bought', 'A new book, 175 gold, you need 51 more gold']);
		expect(stallView(ready(174), null, NO_CHOICE, es).rewards?.tiles[2]?.ariaLabel).toBe('A new book, 175 monedas de oro, te falta 1 moneda de oro');
		expect(stallView(ready(124), null, NO_CHOICE, es).rewards?.tiles[0]?.ariaLabel).toBe('Coffee out, 20 monedas de oro, se puede comprar');
	});

	it('locks a ware the gold cannot reach and says on it how much is missing', () => {
		const tiles = stallView(ready(5), null, NO_CHOICE, en).rewards?.tiles ?? [];

		expect(tiles.map(({ locked, missing }) => ({ locked, missing }))).toEqual([
			{ locked: true, missing: '15 more' },
			{ locked: false, missing: null },
			{ locked: true, missing: '170 more' },
		]);
		expect(stallView(ready(19), null, NO_CHOICE, es).rewards?.tiles[0]?.missing).toBe('falta 1');
		expect(stallView(ready(5), null, NO_CHOICE, es).rewards?.tiles[0]?.missing).toBe('faltan 15');
	});

	it('locks nothing offline, where the gold is unknown, and names the tiles as not for sale now', () => {
		const tiles = stallView(offline(), null, NO_CHOICE, en).offers?.tiles ?? [];

		expect(tiles.map(({ locked, missing, ariaLabel }) => ({ locked, missing, ariaLabel }))).toEqual([
			{ locked: false, missing: null, ariaLabel: 'A book of the week, 40 gold, cannot be bought now' },
			{ locked: false, missing: null, ariaLabel: 'A long walk, 150 gold, cannot be bought now' },
		]);
	});
});

describe('stallView: the chosen ware (M10 S6)', () => {
	const pressed = (view: ReturnType<typeof stallView>, tab: 'rewards' | 'offers') => (view[tab]?.tiles ?? []).filter((tile) => tile.pressed).map((tile) => tile.key);

	it('chooses the first affordable ware when the Shop opens', () => {
		const view = stallView(ready(5), null, NO_CHOICE, en);

		expect(pressed(view, 'rewards')).toEqual(['reward:r-insta']);
		expect(view.rewards?.detail?.key).toBe('reward:r-insta');
	});

	it('chooses the first ware when none is affordable, so the detail says what is missing', () => {
		const view = stallView(ready(1), null, NO_CHOICE, en);

		expect(pressed(view, 'rewards')).toEqual(['reward:r-coffee']);
		expect(view.offers?.detail?.key).toBe('offer:book-week');
	});

	it('keeps the ware the user chose in each tab, a locked one too', () => {
		const view = stallView(ready(5), null, choose('offers', { rewards: 'reward:r-book', offers: 'offer:walk' }), en);

		expect(pressed(view, 'rewards')).toEqual(['reward:r-book']);
		expect(pressed(view, 'offers')).toEqual(['offer:walk']);
	});

	it('goes back to the first affordable ware when the chosen one is gone, as a bought offer is', () => {
		const view = stallView(ready(100, [COFFEE], [BOOK_WEEK]), null, choose('offers', { offers: 'offer:walk' }), en);

		expect(view.offers?.detail?.key).toBe('offer:book-week');
	});
});

describe('stallView: the tabs (M10 S6)', () => {
	const tabs = (view: ReturnType<typeof stallView>) => view.tabs.map(({ id, label, selected }) => `${id}:${label}${selected ? '*' : ''}`);

	it("has three tabs, the user's Habitica rewards first and chosen when the Shop opens, then Esdras's offers and the last purchases", () => {
		const view = stallView(ready(10), null, NO_CHOICE, en);

		expect(view.tabsLabel).toBe('The stall');
		expect(tabs(view)).toEqual(["rewards:Habitica rewards*", "offers:Esdras's offers", 'purchases:Last purchases']);
		expect(tabs(stallView(ready(10), null, NO_CHOICE, es))).toEqual(['rewards:Recompensas de Habitica*', 'offers:Ofertas de Esdras', 'purchases:Últimas compras']);
	});

	it('gives each tab a short label for narrow panes, which its full title holds', () => {
		expect(stallView(ready(10), null, NO_CHOICE, en).tabs.map((tab) => tab.short)).toEqual(['Rewards', 'Offers', 'Purchases']);
		expect(stallView(ready(10), null, NO_CHOICE, es).tabs.map((tab) => tab.short)).toEqual(['Recompensas', 'Ofertas', 'Compras']);
		for (const t of [en, es]) for (const tab of stallView(ready(10), null, NO_CHOICE, t).tabs) expect(tab.label.toLowerCase()).toContain(tab.short.toLowerCase());
	});

	it('shows the tab the user chose', () => {
		expect(tabs(stallView(ready(10), null, choose('purchases'), en))).toEqual(['rewards:Habitica rewards', "offers:Esdras's offers", 'purchases:Last purchases*']);
	});

	it("keeps each tab's own contents: the rewards and the offers as tiles, the purchases as a list", () => {
		const view = stallView(ready(10), null, NO_CHOICE, en);

		expect(view.rewards?.tiles.map((tile) => tile.name)).toEqual(['Coffee out', '[GT] Instagram +30 min', 'A new book']);
		expect(view.offers?.tiles.map((tile) => tile.name)).toEqual(['A book of the week', 'A long walk']);
		expect(view.purchases?.rows.map((row) => row.what)).toEqual(['Coffee out']);
	});

	it('has no rewards tab offline, opens on the offers and says why nothing can be bought', () => {
		const view = stallView(offline(), null, choose('rewards'), en);

		expect(tabs(view)).toEqual(["offers:Esdras's offers*", 'purchases:Last purchases']);
		expect(view.rewards).toBeNull();
		expect(view.note).toEqual({ text: 'Habitica cannot be reached, so nothing can be bought now. Select Sync to try again.', tone: 'warning' });
		expect(view.offline).toBe(true);
		expect(view.gold).toBeNull();
	});

	it('has no tabs while the shop is read', () => {
		const view = stallView(null, null, NO_CHOICE, en);

		expect(view.tabs).toEqual([]);
		expect(view.note?.text).toBe('Reading your gold and rewards from Habitica…');
		expect(view.offline).toBe(false);
	});

	it('moves along the tabs with the arrow keys, Home and End, round from either end', () => {
		const view = stallView(ready(10), null, NO_CHOICE, en);

		expect(nextTab(view.tabs, 'ArrowRight')).toBe('offers');
		expect(nextTab(view.tabs, 'ArrowLeft')).toBe('purchases');
		expect(nextTab(view.tabs, 'End')).toBe('purchases');
		expect(nextTab(stallView(ready(10), null, choose('purchases'), en).tabs, 'ArrowRight')).toBe('rewards');
		expect(nextTab(stallView(ready(10), null, choose('purchases'), en).tabs, 'Home')).toBe('rewards');
		expect(nextTab(view.tabs, 'Enter')).toBeNull();
	});
});

describe('stallView: the detail panel (M10 S6)', () => {
	it('shows the chosen reward: its object, its name, its notes, its price and the gold left after it, and Buy', () => {
		const detail = stallView(ready(2386), null, NO_CHOICE, en).rewards?.detail;

		expect(detail).toEqual({
			key: 'reward:r-coffee',
			name: 'Coffee out',
			object: 'lamp',
			notes: 'At the corner café',
			until: null,
			price: '20',
			priceLabel: '20 gold',
			lines: [
				{ term: 'Price', value: '20 gold' },
				{ term: 'Gold left after', value: '2366 gold' },
			],
			reason: null,
			buy: { text: 'Buy', ariaLabel: 'Buy Coffee out for 20 gold', enabled: true, reason: null, busy: false },
		});
	});

	it("shows an offer with Esdras's why and its last day", () => {
		const detail = stallView(ready(2386), null, NO_CHOICE, en).offers?.detail;

		expect(detail).toMatchObject({ key: 'offer:book-week', name: 'A book of the week', notes: 'Five days of reading in a row', until: 'Until 20 Nov', priceLabel: '40 gold' });
		expect(detail?.buy).toMatchObject({ ariaLabel: 'Buy A book of the week for 40 gold', enabled: true });
	});

	it('holds Buy for a ware the gold cannot reach and says how much is missing instead of the gold left', () => {
		const detail = stallView(ready(124.62), null, choose(null, { rewards: 'reward:r-book' }), en).rewards?.detail;

		expect(detail?.lines).toEqual([{ term: 'Price', value: '175 gold' }]);
		expect(detail?.reason).toBe('You need 51 more gold');
		expect(detail?.buy).toMatchObject({ enabled: false, busy: false });
	});

	it('still says what is missing while another purchase runs', () => {
		const detail = stallView(ready(124.62), 'reward:r-coffee', choose(null, { rewards: 'reward:r-book' }), en).rewards?.detail;

		expect(detail?.reason).toBe('You need 51 more gold');
		expect(detail?.buy).toMatchObject({ enabled: false });
	});

	it('marks the ware being bought, and holds Buy on every other one meanwhile', () => {
		const view = stallView(ready(2386), 'reward:r-coffee', NO_CHOICE, en);

		expect(view.rewards?.detail?.buy).toEqual({ text: 'Buying…', ariaLabel: 'Buy Coffee out for 20 gold', enabled: false, reason: null, busy: true });
		expect(view.offers?.detail?.buy).toMatchObject({ enabled: false, busy: false });
	});

	it('has no Buy and no gold left offline', () => {
		const detail = stallView(offline(), null, NO_CHOICE, en).offers?.detail;

		expect(detail?.buy).toBeNull();
		expect(detail?.lines).toEqual([{ term: 'Price', value: '40 gold' }]);
		expect(detail?.reason).toBeNull();
	});

	it('speaks Spanish', () => {
		const detail = stallView(ready(30), null, NO_CHOICE, es).rewards?.detail;

		expect(detail?.lines).toEqual([
			{ term: 'Precio', value: '20 monedas de oro' },
			{ term: 'Oro que te queda', value: '10 monedas de oro' },
		]);
		expect(detail?.buy?.text).toBe('Comprar');
	});
});

describe('stallView: the empty states (M10 S6)', () => {
	it('says in a sentence that Habitica has no rewards, with no tiles and no detail', () => {
		expect(stallView(ready(10, []), null, NO_CHOICE, en).rewards).toEqual({ tab: 'rewards', tiles: [], detail: null, empty: 'No rewards in Habitica yet. Add them there, under Rewards.', unreadable: null });
	});

	it('says in a sentence that Esdras has no offers, and which rows of Shop.md it could not read', () => {
		const view = stallView({ ...ready(10, [COFFEE], []), offersUnreadable: [{ path: 'Dromos/Shop.md', line: 7, text: '| x |' }] }, null, NO_CHOICE, en);

		expect(view.offers).toEqual({ tab: 'offers', tiles: [], detail: null, empty: 'Esdras has no offers right now.', unreadable: '1 row of Dromos/Shop.md could not be read (line 7).' });
	});

	it('keeps the gold for the coin plaque, named in words', () => {
		expect(stallView(ready(2386.4), null, NO_CHOICE, en).gold).toEqual({ amount: '2386', label: 'Your gold: 2386 gold' });
	});
});

describe("stallView: the rewards Kairos owns are not wares (M10 S1, L13)", () => {
	const load = (rewards: ReturnType<typeof aReward>[]) => {
		const habitica = new FakeHabiticaShop(30, rewards);
		const tags = new FakeTagCatalog([{ id: 't-kairos', name: 'Kairos' }]);
		return new LoadShop({ gold: habitica, rewards: habitica, tags, purse: new InMemoryPurseRepository(), offers: new InMemoryOfferRepository([BOOK_WEEK, WALK]), store: new InMemoryDeviceStore(), clock: new FixedClock(new Date('2026-11-11T15:00:00Z'), '2026-11-11'), hasCredentials: () => true }).execute();
	};
	// The cheapest ware and the dearest are Kairos's: shown, they would take the figs and the chest, and the first ware chosen.
	const kairos = [aReward('r-k-cheap', '[GT] Instagram +30 min', 1, { tags: ['t-kairos'] }), aReward('r-k-dear', '[GT] Film night', 900, { tags: ['t-kairos'] })];
	const own = [aReward('r-tea', 'Tea', 6), COFFEE, BOOK];

	it('ranks the tiles and chooses the first ware as if they were not there', async () => {
		const withKairos = stallView(await load([...kairos, ...own]), null, NO_CHOICE, en);
		const without = stallView(await load(own), null, NO_CHOICE, en);

		expect(withKairos.rewards?.tiles.map((tile) => tile.key)).toEqual(['reward:r-tea', 'reward:r-coffee', 'reward:r-book']);
		expect(withKairos.rewards).toEqual(without.rewards);
		expect(withKairos.offers).toEqual(without.offers);
		expect(withKairos.rewards?.detail?.key).toBe('reward:r-tea');
	});
});
