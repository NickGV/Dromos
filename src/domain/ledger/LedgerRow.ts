import type { XpKind } from '../rules/XpRules';

/**
 * What produced a ledger row. `complete` and `revert` are the two states of a
 * Habitica task; `streak` is the bonus of a daily streak milestone.
 */
export type LedgerSource = 'complete' | 'revert' | 'streak';

/**
 * One row of `Dromos/Ledger/YYYY-MM.md`: a state transition of a Habitica task,
 * never an edit. A quest with several skills writes one row per skill that share
 * `date`, `habiticaId`, `source` and `n`, which together identify the transition.
 */
export interface LedgerRow {
	/** Local date as `YYYY-MM-DD`. */
	readonly date: string;
	readonly habiticaId: string;
	/** Title of the task when the row was written. */
	readonly task: string;
	/** Dailies never count as quests toward an unlock, so the row remembers which one it came from. */
	readonly kind: XpKind;
	/** Skill id, or `null` for a quest without skill (character XP only). */
	readonly skill: string | null;
	/** Signed: a `revert` row carries the negative XP of the `complete` it cancels. */
	readonly xp: number;
	readonly source: LedgerSource;
	/** Sequence number of the transition per task and `source` (per day for dailies). */
	readonly n: number;
}
