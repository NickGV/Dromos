import { describe, expect, it } from 'vitest';
import { LoadShop } from '../../src/application/LoadShop';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { aReward, FakeHabiticaShop } from '../fakes/FakeHabiticaShop';

const COFFEE = aReward('r-coffee', 'Coffee out', 20, { notes: 'At the corner café' });
const BOOK = aReward('r-book', 'A new book', 75);

function setup(options: { credentials?: boolean; gold?: number } = {}) {
	const habitica = new FakeHabiticaShop(options.gold ?? 124.62, [COFFEE, BOOK]);
	const load = new LoadShop({ gold: habitica, rewards: habitica, hasCredentials: () => options.credentials ?? true });
	return { habitica, load };
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
