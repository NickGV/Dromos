import type { GameRules } from '../domain';

/** Fields of the rules note that hold something unusable; they play by the default instead. */
export interface InvalidRules {
	readonly path: string;
	readonly fields: readonly string[];
}

export interface RulesLoadResult {
	readonly rules: GameRules;
	/** `null` when every field written in the note could be used. */
	readonly invalid: InvalidRules | null;
}

/** The rules of the game, `Dromos/Rules.md`. A missing note is not an error: the defaults apply. */
export interface RulesRepository {
	load(): Promise<RulesLoadResult>;
}
