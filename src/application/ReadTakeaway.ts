import type { ResourceRepository } from '../ports';

export interface ReadTakeawayDeps {
	/** Only the read: the card changes nothing through this use case. */
	readonly resources: Pick<ResourceRepository, 'readTakeaway'>;
}

/**
 * Reads what the user wrote under "Lo que me dejó" in a resource, for the card to show read-only
 * (M8 S6). It reads the note on every call and touches no network. It never decides the seal:
 * that comes from the cache. Never rejects: a note that cannot be read is `null`.
 */
export class ReadTakeaway {
	constructor(private readonly deps: ReadTakeawayDeps) {}

	async execute(path: string): Promise<string | null> {
		try {
			return await this.deps.resources.readTakeaway(path);
		} catch {
			return null;
		}
	}
}
