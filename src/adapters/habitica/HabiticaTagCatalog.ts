import { skillIdFromTag, skillTag } from '../../domain';
import { TaskSourceError, type TagCatalog } from '../../ports';
import type { HabiticaClient } from './HabiticaClient';
import { readHabiticaTags } from './habiticaTask';

const TAGS_PATH = '/tags';

/** Finds the `skill/<id>` tags of the Habitica account and creates the missing ones with `POST /tags`. */
export class HabiticaTagCatalog implements TagCatalog {
	constructor(private readonly client: HabiticaClient) {}

	async ensureSkillTags(skillIds: readonly string[]): Promise<string[]> {
		const wanted = [...new Set(skillIds)];
		if (wanted.length === 0) return [];
		try {
			const existing = new Map<string, string>();
			for (const tag of readHabiticaTags(await this.client.get(TAGS_PATH))) {
				const skill = skillIdFromTag(tag.name);
				if (skill !== null && !existing.has(skill)) existing.set(skill, tag.id);
			}
			const ids: string[] = [];
			for (const skill of wanted) {
				const found = existing.get(skill);
				ids.push(found ?? (await this.create(skill)));
			}
			return ids;
		} catch (error) {
			if (error instanceof TaskSourceError) throw error;
			// Unexpected errors are replaced, not wrapped: their messages may carry credentials.
			throw new TaskSourceError('Unknown', null, 'Habitica tags could not be read');
		}
	}

	private async create(skill: string): Promise<string> {
		const [created] = readHabiticaTags([await this.client.post(TAGS_PATH, { name: skillTag(skill) })]);
		if (!created) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected tag');
		return created.id;
	}
}
