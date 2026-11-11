import type { Reward } from '../../src/domain';
import type { GoldAccount, NewReward, RewardCatalog } from '../../src/ports';

/**
 * Habitica's gold and rewards held in memory, as the shop and the level bonus reach them. Every
 * call is recorded in `calls` as `<method> <argument>`, so a test can see what was asked and what
 * was not. A purchase takes the price from the gold, as Habitica does.
 */
export class FakeHabiticaShop implements GoldAccount, RewardCatalog {
	readonly calls: string[] = [];
	/** Makes the method named reject with the error, once per entry, in order. */
	readonly failures = new Map<string, Error[]>();
	/** Makes the method named do its work and then reject with the error, as a request whose answer is lost. */
	readonly lostAnswers = new Map<string, Error[]>();

	constructor(
		public gold: number,
		public rewards: Reward[] = [],
	) {}

	/** Makes the next call of `method` reject with `error`. */
	failNext(method: string, error: Error): this {
		this.failures.set(method, [...(this.failures.get(method) ?? []), error]);
		return this;
	}

	/** Makes the next call of `method` take effect in Habitica and then reject with `error`: its answer never arrives. */
	loseAnswerNext(method: string, error: Error): this {
		this.lostAnswers.set(method, [...(this.lostAnswers.get(method) ?? []), error]);
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

	findByAlias(alias: string): Promise<Reward | null> {
		return this.run('findByAlias', alias, () => this.rewards.find((reward) => reward.alias === alias) ?? null);
	}

	create(reward: NewReward): Promise<Reward> {
		return this.run('create', reward.alias, () => {
			if (this.rewards.some((candidate) => candidate.alias === reward.alias)) throw new Error('Task alias already used on another task.');
			const created: Reward = { id: `created-${this.rewards.length + 1}`, name: reward.name, notes: reward.notes === '' ? null : reward.notes, price: reward.price, alias: reward.alias };
			this.rewards.push(created);
			return created;
		});
	}

	remove(id: string): Promise<void> {
		return this.run('remove', id, () => {
			this.rewards = this.rewards.filter((reward) => reward.id !== id);
		});
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
		const lost = this.lostAnswers.get(method)?.shift();
		try {
			const result = act();
			return lost ? Promise.reject(lost) : Promise.resolve(result);
		} catch (error) {
			return Promise.reject(error instanceof Error ? error : new Error(String(error)));
		}
	}
}

/** A reward as Habitica lists it. */
export function aReward(id: string, name: string, price: number, overrides: Partial<Reward> = {}): Reward {
	return { id, name, notes: null, price, alias: null, ...overrides };
}
