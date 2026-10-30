/**
 * Polynomial level curve: the XP needed to leave a level grows as
 * `round(base * level ^ exponent)`. Both the character and the skills use
 * this shape with different parameters; the numbers live in `Dromos/Rules.md`
 * and these constants are only the defaults.
 */
export interface CurveConfig {
	readonly base: number;
	readonly exponent: number;
}

export const CHARACTER_CURVE: CurveConfig = { base: 100, exponent: 1.5 };
export const SKILL_CURVE: CurveConfig = { base: 100, exponent: 1.3 };

export interface LevelProgress {
	readonly level: number;
	readonly xpIntoLevel: number;
	readonly xpToNext: number;
}

/** Totals above this are clamped so the per-level loop in `progressFor` always ends quickly. */
const MAX_TOTAL_XP = Number.MAX_SAFE_INTEGER;

export class LevelCurve {
	constructor(private readonly config: CurveConfig) {}

	/** XP required to go from `level` to `level + 1`. */
	xpToNext(level: number): number {
		return Math.round(this.config.base * Math.pow(level, this.config.exponent));
	}

	levelFor(totalXp: number): number {
		return this.progressFor(totalXp).level;
	}

	progressFor(totalXp: number): LevelProgress {
		let remaining = Number.isFinite(totalXp) ? Math.min(MAX_TOTAL_XP, Math.max(0, Math.floor(totalXp))) : 0;
		let level = 1;
		while (remaining >= this.xpToNext(level)) {
			remaining -= this.xpToNext(level);
			level += 1;
		}
		return { level, xpIntoLevel: remaining, xpToNext: this.xpToNext(level) };
	}
}
