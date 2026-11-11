import type { NamedTag, TagCatalog } from '../../src/ports';

/** Tag catalog that hands out `tag-<skill>` ids and records what it was asked for; `listTags` answers with `tags`. */
export class FakeTagCatalog implements TagCatalog {
	readonly asked: (readonly string[])[] = [];
	failWith: Error | null = null;
	/** Makes `listTags` reject. */
	failListWith: Error | null = null;
	/** How many times the tags were listed. */
	lists = 0;

	constructor(public tags: NamedTag[] = []) {}

	listTags(): Promise<NamedTag[]> {
		this.lists += 1;
		if (this.failListWith) return Promise.reject(this.failListWith);
		return Promise.resolve([...this.tags]);
	}

	ensureSkillTags(skillIds: readonly string[]): Promise<string[]> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.asked.push(skillIds);
		return Promise.resolve(skillIds.map((id) => `tag-${id}`));
	}
}
