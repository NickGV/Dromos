import type { Reward } from '../domain';

/** The user's own rewards in Habitica (M10 S1), and buying one. */
export interface RewardCatalog {
	/** Every reward of the user, in Habitica's order. Rejects only with a `TaskSourceError`. */
	list(): Promise<Reward[]>;

	/**
	 * Buys the reward with Habitica id `id`, which takes its price from the gold, and resolves with
	 * the gold Habitica holds after it, or `null` when Habitica bought it but sent no readable gold.
	 * Rejects only with a `TaskSourceError`; Habitica answers `Unauthorized` when the gold is short.
	 */
	buy(id: string): Promise<number | null>;
}
