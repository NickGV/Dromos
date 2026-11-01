import type { Skill } from '../domain';
import type { SkillProjection } from './Projections';

/** A skill note that could not be read, with the reason, so the Skills page can list it. */
export interface InvalidSkillNote {
	readonly path: string;
	readonly reason: string;
}

export interface SkillLoadResult {
	readonly skills: readonly Skill[];
	readonly invalid: readonly InvalidSkillNote[];
}

/** The skills stored in the vault, `Dromos/Skills/<id>.md`. */
export interface SkillRepository {
	list(): Promise<SkillLoadResult>;

	/**
	 * Writes the derived fields of one skill note. It touches nothing else and does
	 * not rewrite a note that already holds the projection. Resolves `false` when the
	 * note does not exist or nothing changed.
	 */
	writeProjection(skillId: string, projection: SkillProjection): Promise<boolean>;
}
