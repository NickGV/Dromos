import { CHARACTER_CURVE, SKILL_CURVE, type CurveConfig } from './LevelCurve';
import { DEFAULT_GOLD_PER_LEVEL } from '../shop/Purse';
import { RANK_LEVELS } from './Ranks';
import { XP_TABLE, type XpTable } from './XpRules';

/**
 * The numbers of `Dromos/Rules.md` (S16). The XP table prices new rows only, since a row keeps
 * what it paid; the curves and the rank levels turn the ledger into levels on every read, so
 * changing them recomputes everything.
 */
export interface GameRules {
	readonly xp: XpTable;
	readonly characterCurve: CurveConfig;
	readonly skillCurve: CurveConfig;
	/** The level each rank starts at, in order. */
	readonly rankLevels: readonly number[];
	/** The gold each new level pays, times the level reached (M10 S3, ADR-019): 10 unless the note says otherwise. */
	readonly goldPerLevel: number;
}

export const DEFAULT_RULES: GameRules = { xp: XP_TABLE, characterCurve: CHARACTER_CURVE, skillCurve: SKILL_CURVE, rankLevels: RANK_LEVELS, goldPerLevel: DEFAULT_GOLD_PER_LEVEL };
