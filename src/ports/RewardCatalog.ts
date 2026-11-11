import type { Reward } from '../domain';

/** A reward to create in Habitica: the one an offer's purchase buys (M10 S2). */
export interface NewReward {
	readonly name: string;
	readonly notes: string;
	readonly price: number;
	/** Its Habitica alias, unique per user: `dromos-offer-<id>`. */
	readonly alias: string;
}

/** The user's rewards in Habitica (M10 S1, S2): listing, buying, and the reward of an offer. */
export interface RewardCatalog {
	/** Every reward of the user, in Habitica's order. Rejects only with a `TaskSourceError`. */
	list(): Promise<Reward[]>;

	/**
	 * Buys the reward with Habitica id `id`, which takes its price from the gold, and resolves with
	 * the gold Habitica holds after it, or `null` when Habitica bought it but sent no readable gold.
	 * Rejects only with a `TaskSourceError`; Habitica answers `Unauthorized` when the gold is short.
	 */
	buy(id: string): Promise<number | null>;

	/** The reward with this alias, or `null` when Habitica has no task with it. Rejects only with a `TaskSourceError`. */
	findByAlias(alias: string): Promise<Reward | null>;

	/** Creates a reward and resolves with it. Rejects only with a `TaskSourceError`. */
	create(reward: NewReward): Promise<Reward>;

	/** Deletes the reward with Habitica id `id`. Rejects only with a `TaskSourceError`. */
	remove(id: string): Promise<void>;
}
