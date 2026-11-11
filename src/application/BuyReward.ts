import { canAfford, type Reward } from '../domain';
import { TaskSourceError, type GoldAccount, type RewardCatalog } from '../ports';
import { statusForFailure, type FailedStatus } from './statusForFailure';

/** What one purchase did (M10 S1). Only `bought` spent gold. */
export type PurchaseOutcome =
	/** Habitica took the price; `gold` is what it holds now, `null` when its answer did not say. */
	| { readonly kind: 'bought'; readonly reward: Reward; readonly gold: number | null }
	/** The gold does not pay for it; `gold` is the gold there is. Nothing was asked of Habitica but, at most, the gold. */
	| { readonly kind: 'too-dear'; readonly reward: Reward; readonly gold: number }
	| { readonly kind: 'failed'; readonly reward: Reward; readonly status: FailedStatus }
	| { readonly kind: 'not-configured' }
	/** Another purchase was under way: this one asked nothing. */
	| { readonly kind: 'busy' };

export interface BuyRewardDeps {
	readonly rewards: RewardCatalog;
	readonly gold: GoldAccount;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Buys one of the user's Habitica rewards (M10 S1), once the screen has had the purchase confirmed:
 * `POST /tasks/:id/score/up`, which takes the gold. A reward dearer than the gold shown is refused
 * without a request. Habitica answers a short purse with 401, as it answers bad credentials, so a
 * refusal reads the gold once to tell which it was. One purchase runs at a time. Never rejects.
 */
export class BuyReward {
	private running = false;

	constructor(private readonly deps: BuyRewardDeps) {}

	async execute(reward: Reward, gold: number): Promise<PurchaseOutcome> {
		if (this.running) return { kind: 'busy' };
		this.running = true;
		try {
			return await this.buy(reward, gold);
		} finally {
			this.running = false;
		}
	}

	private async buy(reward: Reward, gold: number): Promise<PurchaseOutcome> {
		if (!this.deps.hasCredentials()) return { kind: 'not-configured' };
		if (!canAfford(gold, reward.price)) return { kind: 'too-dear', reward, gold };
		try {
			return { kind: 'bought', reward, gold: await this.deps.rewards.buy(reward.id) };
		} catch (error) {
			return refusal(error, reward, this.deps.gold);
		}
	}
}

/**
 * What a failed purchase was. A 401 from Habitica is read again with the gold: short of it, the
 * reward was too dear; otherwise, or when the gold cannot be read, the credentials were refused.
 */
export async function refusal(error: unknown, reward: Reward, account: GoldAccount): Promise<PurchaseOutcome> {
	if (error instanceof TaskSourceError && error.kind === 'Unauthorized') {
		try {
			const gold = await account.readGold();
			if (!canAfford(gold, reward.price)) return { kind: 'too-dear', reward, gold };
		} catch {
			// The gold cannot be read either: the credentials are what Habitica refused.
		}
	}
	return { kind: 'failed', reward, status: statusForFailure(error) };
}
