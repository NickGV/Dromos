import { describe, expect, it } from 'vitest';
import { LoadShop } from '../../src/application/LoadShop';
import type { Offer, PurseEntry } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { aReward, FakeHabiticaShop } from '../fakes/FakeHabiticaShop';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';
import { InMemoryOfferRepository } from '../fakes/InMemoryOfferRepository';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { InMemoryPurseRepository } from '../fakes/InMemoryPurseRepository';

const clock = new FixedClock(new Date('2026-11-11T15:00:00Z'), '2026-11-11');

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const BOOK = aReward('r-book', 'A new book', 75);

const bought = (date: string, what: string, gold: number): PurseEntry => ({ date, kind: 'purchase', what, gold, level: null, offer: null });

function setup(options: { credentials?: boolean; gold?: number; purse?: PurseEntry[]; offers?: Offer[]; store?: InMemoryDeviceStore; tags?: FakeTagCatalog } = {}) {
	const habitica = new FakeHabiticaShop(options.gold ?? 124.62, [COFFEE, BOOK]);
	const purse = new InMemoryPurseRepository(options.purse ?? []);
	const offers = new InMemoryOfferRepository(options.offers ?? []);
	const store = options.store ?? new InMemoryDeviceStore();
	const tags = options.tags ?? new FakeTagCatalog();
	const load = new LoadShop({ gold: habitica, rewards: habitica, tags, purse, offers, store, clock, hasCredentials: () => options.credentials ?? true });
	return { habitica, purse, offers, store, tags, load };
}

describe('LoadShop: the gold and the Habitica rewards (M10 S1)', () => {
	it("reads the gold, then the user's rewards, and is ready", async () => {
		const { habitica, load } = setup();

		const shop = await load.execute();

		expect(shop.status).toEqual({ kind: 'ready' });
		expect(shop.gold).toBe(124.62);
		expect(shop.rewards).toEqual([COFFEE, BOOK]);
		expect(habitica.calls).toEqual(['readGold', 'list']);
	});

	it('asks Habitica nothing without credentials, and says so', async () => {
		const { habitica, load } = setup({ credentials: false });

		const shop = await load.execute();

		expect(shop.status).toEqual({ kind: 'not-configured' });
		expect(shop.gold).toBeNull();
		expect(shop.rewards).toBeNull();
		expect(habitica.calls).toEqual([]);
	});

	it('is offline when Habitica cannot be reached, with no gold and no rewards to buy', async () => {
		const { habitica, load } = setup();
		habitica.failNext('readGold', new TaskSourceError('Offline', null, 'Habitica could not be reached'));

		const shop = await load.execute();

		expect(shop.status).toEqual({ kind: 'offline' });
		expect(shop.gold).toBeNull();
		expect(shop.rewards).toBeNull();
		// A failed read spends no further request.
		expect(habitica.calls).toEqual(['readGold']);
	});

	it('maps the other failures as the sync does, and never rejects', async () => {
		const failures = [
			[new TaskSourceError('Unauthorized', null, 'x'), { kind: 'unauthorized' }],
			[new TaskSourceError('RateLimited', 30, 'x'), { kind: 'rate-limited', retryAfterSeconds: 30 }],
			[new Error('boom'), { kind: 'error' }],
		] as const;
		for (const [error, status] of failures) {
			const { habitica, load } = setup();
			habitica.failNext('list', error);

			const shop = await load.execute();

			expect(shop.status).toEqual(status);
			expect(shop.gold).toBeNull();
			expect(shop.rewards).toBeNull();
		}
	});
});

describe('LoadShop: the last purchases from the purse (M10 S3, S4)', () => {
	const purse = [
		bought('2026-11-01', 'Tea', -5),
		{ date: '2026-11-02', kind: 'bonus', what: 'Level 3', gold: 30, level: 3, offer: null } as const,
		bought('2026-11-03', 'Coffee out', -20),
		bought('2026-11-04', 'Film', -15),
		bought('2026-11-05', 'Book', -75),
		bought('2026-11-06', 'Cake', -10),
		bought('2026-11-07', 'Walk', -3),
	];

	it('lists the last five purchases, newest first, with the gold and the rewards', async () => {
		const shop = await setup({ purse }).load.execute();

		expect(shop.purchases.map((entry) => entry.what)).toEqual(['Walk', 'Cake', 'Book', 'Film', 'Coffee out']);
		expect(shop.purseUnreadable).toEqual([]);
	});

	it('lists them offline and without credentials too: the purse is in the vault', async () => {
		const offline = setup({ purse });
		offline.habitica.failNext('readGold', new TaskSourceError('Offline', null, 'x'));

		expect((await offline.load.execute()).purchases).toHaveLength(5);
		expect((await setup({ purse, credentials: false }).load.execute()).purchases).toHaveLength(5);
	});

	it('passes on the rows of the purse it could not read, and shows no purchases when it cannot read the note', async () => {
		const unreadable = new InMemoryPurseRepository([], [{ path: 'Dromos/Purse.md', line: 9, text: '| x |' }]);
		const habitica = new FakeHabiticaShop(10);
		expect((await new LoadShop({ gold: habitica, rewards: habitica, tags: new FakeTagCatalog(), purse: unreadable, offers: new InMemoryOfferRepository(), store: new InMemoryDeviceStore(), clock, hasCredentials: () => true }).execute()).purseUnreadable).toEqual([{ path: 'Dromos/Purse.md', line: 9, text: '| x |' }]);

		const broken = setup({ purse });
		broken.purse.failReadWith = new Error('locked');
		const shop = await broken.load.execute();
		expect(shop.status).toEqual({ kind: 'ready' });
		expect(shop.purchases).toEqual([]);
	});
});

describe("LoadShop: Esdras's offers (M10 S2)", () => {
	const offer = (id: string, until: string | null = null): Offer => ({ id, offer: `Offer ${id}`, price: 30, why: null, until });
	const OFFERS = [offer('gone', '2026-11-10'), offer('today', '2026-11-11'), offer('later', '2026-12-01'), offer('done')];
	const DONE: PurseEntry = { date: '2026-11-05', kind: 'purchase', what: 'Offer done', gold: -30, level: null, offer: 'done' };

	it('shows the open offers: not bought, and not past their last day', async () => {
		const shop = await setup({ offers: OFFERS, purse: [DONE] }).load.execute();

		expect(shop.offers.map((entry) => entry.id)).toEqual(['today', 'later']);
		expect(shop.offersUnreadable).toEqual([]);
	});

	it('shows them offline too, from the vault, with nothing to buy them with', async () => {
		const { habitica, load } = setup({ offers: OFFERS });
		habitica.failNext('readGold', new TaskSourceError('Offline', null, 'x'));

		const shop = await load.execute();

		expect(shop.status).toEqual({ kind: 'offline' });
		expect(shop.offers.map((entry) => entry.id)).toEqual(['today', 'later', 'done']);
	});

	it("never lists an offer's reward as the user's own, even when its delete failed", async () => {
		const { habitica, load } = setup();
		habitica.rewards = [...habitica.rewards, aReward('left', 'Offer walk', 15, { alias: 'dromos-offer-walk' }), aReward('mine', 'Tea', 3, { alias: 'tea' })];

		expect((await load.execute()).rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-book', 'mine']);
	});

	it('passes on the rows of Shop.md it could not read, and shows no offers when it cannot read the note', async () => {
		const habitica = new FakeHabiticaShop(10);
		const unreadable = new InMemoryOfferRepository([], [{ path: 'Dromos/Shop.md', line: 7, text: '| x |' }]);
		const shop = await new LoadShop({ gold: habitica, rewards: habitica, tags: new FakeTagCatalog(), purse: new InMemoryPurseRepository(), offers: unreadable, store: new InMemoryDeviceStore(), clock, hasCredentials: () => true }).execute();
		expect(shop.offersUnreadable).toEqual([{ path: 'Dromos/Shop.md', line: 7, text: '| x |' }]);

		const broken = setup({ offers: OFFERS });
		broken.offers.failWith = new Error('locked');
		expect((await broken.load.execute()).offers).toEqual([]);
	});
});

describe('LoadShop: an offer bought whose purse row is still owed (L8)', () => {
	const WALK: Offer = { id: 'walk', offer: 'A long walk', price: 15, why: null, until: null };
	const ROW: PurseEntry = { date: '2026-11-10', kind: 'purchase', what: 'A long walk', gold: -15, level: null, offer: 'walk' };
	const owed = () => new InMemoryDeviceStore({ 'offer-rows-pending': [ROW] });

	it('writes the row it still owes, then shows the offer as bought', async () => {
		const { purse, store, load } = setup({ offers: [WALK], store: owed() });

		const shop = await load.execute();

		expect(purse.appended).toEqual([[ROW]]);
		expect(store.read('offer-rows-pending')).toBeNull();
		expect(shop.offers).toEqual([]);
		expect(shop.purchases).toEqual([ROW]);
	});

	it('keeps the offer off sale while the purse still cannot keep the row, and keeps the row owed', async () => {
		const { purse, store, load } = setup({ offers: [WALK], store: owed() });
		purse.failAppendWith = new Error('disk full');

		const shop = await load.execute();

		expect(shop.offers).toEqual([]);
		expect(store.read('offer-rows-pending')).toEqual([ROW]);
	});

	it('does not write a row the purse already holds, added by hand, and forgets it', async () => {
		const { purse, store, load } = setup({ offers: [WALK], purse: [ROW], store: owed() });

		await load.execute();

		expect(purse.appended).toEqual([]);
		expect(store.read('offer-rows-pending')).toBeNull();
	});
});

describe("LoadShop: the rewards Kairos owns, tagged kairos (M10 S1, L13)", () => {
	const KAIROS = { id: 't-kairos', name: 'kairos' };
	const INSTA = aReward('r-insta', '[GT] Instagram +30 min', 3, { tags: ['t-kairos'] });
	const TWITCH = aReward('r-twitch', '[GT] Twitch 30 min', 5, { tags: ['t-media'] });

	it('hides a reward carrying the kairos tag and keeps the others, reading the tags in the same load', async () => {
		const { habitica, tags, load } = setup({ tags: new FakeTagCatalog([KAIROS, { id: 't-media', name: 'media' }]) });
		habitica.rewards = [COFFEE, INSTA, TWITCH, BOOK];

		const shop = await load.execute();

		expect(shop.rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-twitch', 'r-book']);
		expect(habitica.calls).toEqual(['readGold', 'list']);
		expect(tags.lists).toBe(1);
	});

	it('hides nothing when Habitica has no tag named kairos', async () => {
		const { habitica, load } = setup({ tags: new FakeTagCatalog([{ id: 't-media', name: 'media' }]) });
		habitica.rewards = [COFFEE, INSTA, TWITCH];

		expect((await load.execute()).rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-insta', 'r-twitch']);
	});

	it('matches the tag name without caring for case or the spaces around it, every tag so named', async () => {
		const { habitica, load } = setup({ tags: new FakeTagCatalog([{ id: 't-kairos', name: '  KaiRos ' }, { id: 't-kairos-2', name: 'KAIROS' }, { id: 't-other', name: 'kairos 2.0' }]) });
		habitica.rewards = [COFFEE, INSTA, aReward('r-second', 'Second', 4, { tags: ['t-kairos-2'] }), aReward('r-near', 'Near', 4, { tags: ['t-other'] })];

		expect((await load.execute()).rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-near']);
	});

	it('spends no request on the tags when no reward carries one', async () => {
		const { tags, load } = setup({ tags: new FakeTagCatalog([KAIROS]) });

		expect((await load.execute()).rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-book']);
		expect(tags.lists).toBe(0);
	});

	it('shows every reward, and stays ready, when the tags cannot be read', async () => {
		const failing = new FakeTagCatalog([KAIROS]);
		failing.failListWith = new TaskSourceError('RateLimited', 30, 'x');
		const { habitica, load } = setup({ tags: failing });
		habitica.rewards = [COFFEE, INSTA];

		const shop = await load.execute();

		expect(shop.status).toEqual({ kind: 'ready' });
		expect(shop.gold).toBe(124.62);
		expect(shop.rewards?.map((reward) => reward.id)).toEqual(['r-coffee', 'r-insta']);
	});
});
