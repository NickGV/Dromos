import { describe, expect, it } from 'vitest';
import { BuyReward } from '../../src/application/BuyReward';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { aReward, FakeHabiticaShop } from '../fakes/FakeHabiticaShop';

const COFFEE = aReward('r-coffee', 'Coffee out', 20);
const BOOK = aReward('r-book', 'A new book', 75);

function setup(options: { credentials?: boolean; gold?: number } = {}) {
	const habitica = new FakeHabiticaShop(options.gold ?? 124.62, [COFFEE, BOOK]);
	const buy = new BuyReward({ rewards: habitica, gold: habitica, hasCredentials: () => options.credentials ?? true });
	return { habitica, buy };
}

describe('BuyReward: buying one of your Habitica rewards (M10 S1)', () => {
	it('buys it in Habitica and answers with the gold Habitica returns', async () => {
		const { habitica, buy } = setup();

		const outcome = await buy.execute(COFFEE, 124.62);

		expect(outcome).toEqual({ kind: 'bought', reward: COFFEE, gold: 104.62 });
		expect(habitica.calls).toEqual(['buy r-coffee']);
	});

	it('never asks Habitica for a reward that costs more than the gold shown, and says what there is', async () => {
		const { habitica, buy } = setup({ gold: 60 });

		const outcome = await buy.execute(BOOK, 60);

		expect(outcome).toEqual({ kind: 'too-dear', reward: BOOK, gold: 60 });
		expect(habitica.calls).toEqual([]);
	});

	it('buys a reward that costs exactly the gold there is', async () => {
		const { habitica, buy } = setup({ gold: 20 });

		expect(await buy.execute(COFFEE, 20)).toEqual({ kind: 'bought', reward: COFFEE, gold: 0 });
		expect(habitica.calls).toEqual(['buy r-coffee']);
	});

	it('asks nothing without credentials', async () => {
		const { habitica, buy } = setup({ credentials: false });

		expect(await buy.execute(COFFEE, 124)).toEqual({ kind: 'not-configured' });
		expect(habitica.calls).toEqual([]);
	});

	it('when Habitica refuses (it answers 401 for too little gold too), reads the gold again to say which it was', async () => {
		const { habitica, buy } = setup({ gold: 10 });
		habitica.failNext('buy', new TaskSourceError('Unauthorized', null, 'Habitica rejected the credentials'));

		const outcome = await buy.execute(COFFEE, 30);

		expect(outcome).toEqual({ kind: 'too-dear', reward: COFFEE, gold: 10 });
		expect(habitica.calls).toEqual(['buy r-coffee', 'readGold']);
	});

	it('reports a refusal as unauthorized when the gold would have paid for it', async () => {
		const { habitica, buy } = setup({ gold: 124 });
		habitica.failNext('buy', new TaskSourceError('Unauthorized', null, 'x'));

		expect(await buy.execute(COFFEE, 124)).toEqual({ kind: 'failed', reward: COFFEE, status: { kind: 'unauthorized' } });
	});

	it('reports a refusal as unauthorized when the gold cannot be read again either', async () => {
		const { habitica, buy } = setup();
		habitica.failNext('buy', new TaskSourceError('Unauthorized', null, 'x')).failNext('readGold', new TaskSourceError('Unauthorized', null, 'x'));

		expect(await buy.execute(COFFEE, 124)).toEqual({ kind: 'failed', reward: COFFEE, status: { kind: 'unauthorized' } });
	});

	it('reports the other failures with their status, and never rejects', async () => {
		const failures = [
			[new TaskSourceError('Offline', null, 'x'), { kind: 'offline' }],
			[new TaskSourceError('RateLimited', 12, 'x'), { kind: 'rate-limited', retryAfterSeconds: 12 }],
			[new TaskSourceError('Unknown', null, 'x'), { kind: 'error' }],
			[new Error('boom'), { kind: 'error' }],
		] as const;
		for (const [error, status] of failures) {
			const { habitica, buy } = setup();
			habitica.failNext('buy', error);

			expect(await buy.execute(COFFEE, 124)).toEqual({ kind: 'failed', reward: COFFEE, status });
			expect(habitica.calls).toEqual(['buy r-coffee']);
		}
	});

	it('answers a purchase already under way as busy, so one click never buys twice', async () => {
		const { habitica, buy } = setup();

		const [first, second] = await Promise.all([buy.execute(COFFEE, 124), buy.execute(COFFEE, 124)]);

		expect(first.kind).toBe('bought');
		expect(second).toEqual({ kind: 'busy' });
		expect(habitica.calls).toEqual(['buy r-coffee']);
	});
});
