/**
 * One of the user's own Habitica rewards (M10 S1, ADR-019): a task of type `reward`. The gold it
 * costs is Habitica's; Dromos keeps no currency of its own.
 */
export interface Reward {
	/** Its Habitica task id. */
	readonly id: string;
	readonly name: string;
	/** Its notes, or `null` when it has none. */
	readonly notes: string | null;
	/** Its price in gold, Habitica's `value`. */
	readonly price: number;
	/** Its Habitica alias (a short name unique per user), or `null` when it has none. */
	readonly alias: string | null;
	/** The ids of the Habitica tags it carries. */
	readonly tags: readonly string[];
}

/**
 * The Habitica tag of the rewards Kairos owns (M10 S1, L13): Kairos buys them itself, and buying
 * one in Dromos would spend the gold with no minutes in Kairos, so the Shop does not list them.
 */
export const KAIROS_TAG = 'kairos';

/** The ids of every tag named `name`, matched without case or the spaces around it. */
export function tagIdsNamed(tags: readonly { readonly id: string; readonly name: string }[], name: string): Set<string> {
	const wanted = name.trim().toLowerCase();
	return new Set(tags.filter((tag) => tag.name.trim().toLowerCase() === wanted).map((tag) => tag.id));
}

/** Whether a reward carries one of the tags `ids`. */
export function carriesTag(reward: Pick<Reward, 'tags'>, ids: ReadonlySet<string>): boolean {
	return reward.tags.some((id) => ids.has(id));
}

/** Whether `gold` pays for `price`: Habitica refuses a reward that costs more than the gold there is. */
export function canAfford(gold: number, price: number): boolean {
	return gold >= price;
}

/** Habitica's gold as Dromos shows it (M10 S1): a whole number, the fraction dropped. */
export function wholeGold(gold: number): number {
	return Math.floor(gold);
}

/** The whole gold `gold` lacks to pay `price`: at least 1 for a price it cannot pay, else 0. */
export function goldShort(gold: number, price: number): number {
	return canAfford(gold, price) ? 0 : Math.max(1, Math.ceil(price - gold));
}
