import type { Reward } from '../../src/domain';
import type { GoldAccount, RewardCatalog } from '../../src/ports';

/**
 * Habitica's gold and rewards held in memory, as the shop and the level bonus reach them. Every
 * call is recorded in `calls` as `<method> <argument>`, so a test can see what was asked and what
 * was not. A purchase takes the price from the gold, as Habitica does.
 */
export class FakeHabiticaShop implements GoldAccount, RewardCatalog {
	readonly calls: string[] = [];
	/** Makes the method named reject with the error, once per entry, in order. */
	readonly failures = new Map<string, Error[]>();

	constructor(
		public gold: number,
		public rewards: Reward[] = [],
	) {}

	/** Makes the next call of `method` reject with `error`. */
	failNext(method: string, error: Error): this {
		this.failures.set(method, [...(this.failures.get(method) ?? []), error]);
		return this;
	}

	readGold(): Promise<number> {
		return this.run('readGold', '', () => this.gold);
	}

	setGold(gold: number): Promise<number> {
		return this.run('setGold', String(gold), () => {
			this.gold = gold;
			return this.gold;
		});
	}

	list(): Promise<Reward[]> {
		return this.run('list', '', () => [...this.rewards]);
	}

	buy(id: string): Promise<number | null> {
		return this.run('buy', id, () => {
			const reward = this.rewards.find((candidate) => candidate.id === id);
			if (!reward) throw new Error(`no reward ${id}`);
			this.gold -= reward.price;
			return this.gold;
		});
	}

	private run<T>(method: string, argument: string, act: () => T): Promise<T> {
		this.calls.push(argument === '' ? method : `${method} ${argument}`);
		const queued = this.failures.get(method);
		const failure = queued?.shift();
		if (failure) return Promise.reject(failure);
		try {
			return Promise.resolve(act());
		} catch (error) {
			return Promise.reject(error instanceof Error ? error : new Error(String(error)));
		}
	}
}

/** A reward as Habitica lists it. */
export function aReward(id: string, name: string, price: number, overrides: Partial<Reward> = {}): Reward {
	return { id, name, notes: null, price, alias: null, ...overrides };
}
