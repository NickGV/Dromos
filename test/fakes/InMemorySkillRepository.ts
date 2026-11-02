import type { Skill } from '../../src/domain';
import type { InvalidSkillNote, SkillLoadResult, SkillProjection, SkillRepository } from '../../src/ports';

/** Skills held in memory. A projection written is applied to the stored skill, like the vault does. */
export class InMemorySkillRepository implements SkillRepository {
	readonly written: { skillId: string; projection: SkillProjection }[] = [];
	/** The last projection each skill received, changed or not. */
	readonly projections = new Map<string, SkillProjection>();
	failWith: Error | null = null;

	constructor(
		private skills: readonly Skill[],
		private readonly invalid: readonly InvalidSkillNote[] = [],
	) {}

	list(): Promise<SkillLoadResult> {
		if (this.failWith) return Promise.reject(this.failWith);
		return Promise.resolve({ skills: this.skills, invalid: this.invalid });
	}

	writeProjection(skillId: string, projection: SkillProjection): Promise<boolean> {
		if (this.failWith) return Promise.reject(this.failWith);
		const skill = this.skills.find((candidate) => candidate.id === skillId);
		if (!skill) return Promise.resolve(false);
		this.projections.set(skillId, projection);
		const changed = skill.unlocked !== projection.unlocked || skill.unlockedOn !== projection.unlockedOn;
		this.skills = this.skills.map((candidate) =>
			candidate === skill ? { ...candidate, unlocked: projection.unlocked, unlockedOn: projection.unlockedOn } : candidate,
		);
		if (changed) this.written.push({ skillId, projection });
		return Promise.resolve(changed);
	}
}
