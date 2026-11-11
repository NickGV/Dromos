import { describe, expect, it } from 'vitest';
import { BuyOffer } from '../../src/application/BuyOffer';
import type { Offer, PurseEntry } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { aReward, FakeHabiticaShop } from '../fakes/FakeHabiticaShop';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';
import { InMemoryPurseRepository } from '../fakes/InMemoryPurseRepository';

const TODAY = '2026-11-11';
const BOOK: Offer = { id: 'book-week', offer: 'A book of the week', price: 40, why: 'Five days of reading in a row', until: '2026-11-20' };
const ITEM = { name: 'A book of the week', price: 40 };
const ROW: PurseEntry = { date: TODAY, kind: 'purchase', what: 'A book of the week', gold: -40, level: null, offer: 'book-week' };

function setup(options: { gold?: number; purse?: PurseEntry[]; credentials?: boolean; store?: InMemoryDeviceStore } = {}) {
	const habitica = new FakeHabiticaShop(options.gold ?? 100);
	const purse = new InMemoryPurseRepository(options.purse ?? []);
	const store = options.store ?? new InMemoryDeviceStore();
	const buy = new BuyOffer({ rewards: habitica, gold: habitica, purse, store, clock: new FixedClock(new Date(`${TODAY}T15:00:00Z`), TODAY), hasCredentials: () => options.credentials ?? true });
	return { habitica, purse, store, buy };
}

describe('BuyOffer: buying one of Esdras offers (M10 S2)', () => {
	it('creates the reward with alias dromos-offer-<id>, buys it, writes the purchase with the offer id, then deletes the reward', async () => {
		const { habitica, purse, buy } = setup({ gold: 100 });

		const outcome = await buy.execute(BOOK, 100);

		expect(outcome).toEqual({ kind: 'bought', item: ITEM, gold: 60, recorded: true, entry: ROW });
		expect(habitica.calls).toEqual(['findByAlias dromos-offer-book-week', 'create dromos-offer-book-week', 'buy created-1', 'remove created-1']);
		expect(purse.appended).toEqual([[ROW]]);
		expect(habitica.rewards).toEqual([]);
	});

	it('gives the created reward the offer, its why as notes, and its price', async () => {
		const { habitica, buy } = setup();
		habitica.failNext('buy', new TaskSourceError('Offline', null, 'x'));

		await buy.execute(BOOK, 100);

		expect(habitica.rewards).toEqual([{ id: 'created-1', name: 'A book of the week', notes: 'Five days of reading in a row', price: 40, alias: 'dromos-offer-book-week' }]);
	});

	it('reuses the reward a failed attempt left, so a retry never creates a second one', async () => {
		const { habitica, buy } = setup();
		habitica.rewards = [aReward('left-over', 'A book of the week', 40, { alias: 'dromos-offer-book-week' })];

		const outcome = await buy.execute(BOOK, 100);

		expect(outcome.kind).toBe('bought');
		expect(habitica.calls).toEqual(['findByAlias dromos-offer-book-week', 'buy left-over', 'remove left-over']);
	});

	it('replaces a left-over reward whose price is not the one confirmed, so the gold taken is the price shown', async () => {
		const { habitica, buy } = setup();
		habitica.rewards = [aReward('old', 'A book of the week', 25, { alias: 'dromos-offer-book-week' })];

		await buy.execute(BOOK, 100);

		expect(habitica.calls).toEqual(['findByAlias dromos-offer-book-week', 'remove old', 'create dromos-offer-book-week', 'buy created-1', 'remove created-1']);
		expect(habitica.gold).toBe(60);
	});

	it('asks Habitica nothing for an offer dearer than the gold shown', async () => {
		const { habitica, purse, buy } = setup({ gold: 30 });

		expect(await buy.execute(BOOK, 30)).toEqual({ kind: 'too-dear', item: ITEM, gold: 30 });
		expect(habitica.calls).toEqual([]);
		expect(purse.appended).toEqual([]);
	});

	it('asks nothing without credentials', async () => {
		const { habitica, buy } = setup({ credentials: false });

		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'not-configured' });
		expect(habitica.calls).toEqual([]);
	});

	it('never buys an offer the purse says was bought, even if the screen still showed it', async () => {
		const { habitica, purse, buy } = setup({ purse: [ROW] });

		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'already-bought', item: ITEM });
		expect(habitica.calls).toEqual([]);
		expect(purse.appended).toEqual([]);
	});

	it('writes nothing and keeps the reward for a retry when the purchase fails', async () => {
		const { habitica, purse, buy } = setup();
		habitica.failNext('buy', new TaskSourceError('Unknown', null, 'x'));

		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'failed', item: ITEM, status: { kind: 'error' } });
		expect(purse.appended).toEqual([]);
		expect(habitica.calls).toEqual(['findByAlias dromos-offer-book-week', 'create dromos-offer-book-week', 'buy created-1']);
		expect(habitica.gold).toBe(100);
	});

	it('writes nothing when the reward cannot be found or created', async () => {
		const lookup = setup();
		lookup.habitica.failNext('findByAlias', new TaskSourceError('Offline', null, 'x'));
		expect(await lookup.buy.execute(BOOK, 100)).toEqual({ kind: 'failed', item: ITEM, status: { kind: 'offline' } });
		expect(lookup.habitica.calls).toEqual(['findByAlias dromos-offer-book-week']);

		const creation = setup();
		creation.habitica.failNext('create', new TaskSourceError('Unknown', null, 'x'));
		expect(await creation.buy.execute(BOOK, 100)).toEqual({ kind: 'failed', item: ITEM, status: { kind: 'error' } });
		expect(creation.purse.appended).toEqual([]);
	});

	it('reads the gold again when Habitica refuses, to tell a short purse from bad credentials', async () => {
		const { habitica, buy } = setup({ gold: 10 });
		habitica.failNext('buy', new TaskSourceError('Unauthorized', null, 'x'));

		expect(await buy.execute(BOOK, 50)).toEqual({ kind: 'too-dear', item: ITEM, gold: 10 });
	});

	it('keeps the purchase when deleting the reward fails: such a reward is never listed as the user own', async () => {
		const { habitica, purse, buy } = setup();
		habitica.failNext('remove', new TaskSourceError('Offline', null, 'x'));

		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'bought', item: ITEM, gold: 60, recorded: true, entry: ROW });
		expect(purse.appended).toEqual([[ROW]]);
	});

	it('says so when the purse cannot keep the purchase', async () => {
		const { purse, buy } = setup();
		purse.failAppendWith = new Error('disk full');

		expect(await buy.execute(BOOK, 100)).toMatchObject({ kind: 'bought', recorded: false });
	});

	it('remembers on the device an offer bought whose row the purse could not keep, and never buys it again (L8)', async () => {
		const { habitica, purse, store, buy } = setup();
		purse.failAppendWith = new Error('disk full');
		await buy.execute(BOOK, 100);

		expect(store.read('offer-rows-pending')).toEqual([ROW]);
		const calls = habitica.calls.length;
		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'already-bought', item: ITEM });
		expect(habitica.calls).toHaveLength(calls);
	});

	it('says the purse could not be read, and buys nothing, when it cannot tell whether the offer was bought (L8)', async () => {
		const { habitica, purse, buy } = setup();
		purse.failReadWith = new Error('locked');

		expect(await buy.execute(BOOK, 100)).toEqual({ kind: 'purse-unreadable', item: ITEM });
		expect(habitica.calls).toEqual([]);
	});

	it('runs one purchase at a time', async () => {
		const { habitica, buy } = setup({ gold: 200 });

		const [first, second] = await Promise.all([buy.execute(BOOK, 200), buy.execute(BOOK, 200)]);

		expect(first.kind).toBe('bought');
		expect(second).toEqual({ kind: 'busy' });
		expect(habitica.calls.filter((call) => call.startsWith('buy'))).toHaveLength(1);
	});
});
