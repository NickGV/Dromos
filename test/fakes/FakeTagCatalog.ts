import type { TagCatalog } from '../../src/ports';

/** Tag catalog that hands out `tag-<skill>` ids and records what it was asked for. */
export class FakeTagCatalog implements TagCatalog {
	readonly asked: (readonly string[])[] = [];
	failWith: Error | null = null;

	ensureSkillTags(skillIds: readonly string[]): Promise<string[]> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.asked.push(skillIds);
		return Promise.resolve(skillIds.map((id) => `tag-${id}`));
	}
}
