import { canAfford, type PurseEntry, type Reward } from '../domain';
import { TaskSourceError, type Clock, type GoldAccount, type PurseRepository, type RewardCatalog } from '../ports';
import { statusForFailure, type FailedStatus } from './statusForFailure';

/** What one purchase did (M10 S1). Only `bought` spent gold. */
export type PurchaseOutcome =
	/**
	 * Habitica took the price; `gold` is what it holds now, `null` when its answer did not say.
	 * `recorded` is false when the purse could not keep the purchase's row (M10 S3).
	 */
	| { readonly kind: 'bought'; readonly reward: Reward; readonly gold: number | null; readonly recorded: boolean }
	/** The gold does not pay for it; `gold` is the gold there is. Nothing was asked of Habitica but, at most, the gold. */
	| { readonly kind: 'too-dear'; readonly reward: Reward; readonly gold: number }
	| { readonly kind: 'failed'; readonly reward: Reward; readonly status: FailedStatus }
	| { readonly kind: 'not-configured' }
	/** Another purchase was under way: this one asked nothing. */
	| { readonly kind: 'busy' };

export interface BuyRewardDeps {
	readonly rewards: RewardCatalog;
	readonly gold: GoldAccount;
	/** Where each purchase is written once Habitica confirms it (M10 S3). */
	readonly purse: PurseRepository;
	readonly clock: Clock;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/**
 * Buys one of the user's Habitica rewards (M10 S1), once the screen has had the purchase confirmed:
 * `POST /tasks/:id/score/up`, which takes the gold. A reward dearer than the gold shown is refused
 * without a request. Habitica answers a short purse with 401, as it answers bad credentials, so a
 * refusal reads the gold once to tell which it was. Once Habitica confirms, the purchase is written
 * into the purse, its price as negative gold (M10 S3); a purchase that fails writes nothing. One
 * purchase runs at a time. Never rejects.
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
		let after: number | null;
		try {
			after = await this.deps.rewards.buy(reward.id);
		} catch (error) {
			return refusal(error, reward, this.deps.gold);
		}
		const entry: PurseEntry = { date: this.deps.clock.today(), kind: 'purchase', what: reward.name, gold: -reward.price, level: null, offer: null };
		return { kind: 'bought', reward, gold: after, recorded: await recordInPurse(this.deps.purse, entry) };
	}
}

/** Writes one row into the purse; `false` when it could not, which the purchase survives. */
export function recordInPurse(purse: PurseRepository, entry: PurseEntry): Promise<boolean> {
	return purse.append([entry]).then(
		() => true,
		() => false,
	);
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
