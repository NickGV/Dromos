/**
 * The user's gold, Habitica's `stats.gp` (M10, ADR-019): Dromos keeps no currency of its own, so
 * every amount is read from Habitica and written there.
 */
export interface GoldAccount {
	/** The gold there is now. Rejects only with a `TaskSourceError`. */
	readGold(): Promise<number>;

	/**
	 * Sets the gold to `gold` and resolves with the gold Habitica then holds, or `null` when its answer
	 * did not say. Only the level bonus calls it (M10 S3). Rejects only with a `TaskSourceError`.
	 */
	setGold(gold: number): Promise<number | null>;
}
