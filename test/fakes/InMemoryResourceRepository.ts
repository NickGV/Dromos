import { compareBySaved, type Resource } from '../../src/domain';
import type { MarkFinishedFields, ResourceRepository, ResourceWriteResult } from '../../src/ports';

/**
 * Resource repository backed by a list, for use-case and container tests. Its write changes the
 * listed resource with the same check as the vault: a `finished` date already set is kept.
 */
export class InMemoryResourceRepository implements ResourceRepository {
	readonly writes: { readonly path: string; readonly fields: MarkFinishedFields }[] = [];
	/** Every write rejects with it, as a note that cannot be saved does. */
	failWritesWith: Error | null = null;
	/** `readTakeaway` rejects with it, as a note that cannot be read does. */
	failReadsWith: Error | null = null;
	/** What `readTakeaway` answers for each listed resource, by path; one without an entry has nothing written. */
	readonly takeaways = new Map<string, string>();

	constructor(private resources: readonly Resource[] = []) {}

	list(): Promise<readonly Resource[]> {
		return Promise.resolve([...this.resources].sort(compareBySaved));
	}

	markFinished(path: string, fields: MarkFinishedFields): Promise<ResourceWriteResult> {
		if (this.failWritesWith) return Promise.reject(this.failWritesWith);
		const resource = this.resources.find((candidate) => candidate.path === path);
		if (!resource) return Promise.resolve('not-found');
		if (resource.finished !== null) return Promise.resolve('already-finished');

		this.writes.push({ path, fields });
		this.resources = this.resources.map((candidate) => (candidate === resource ? { ...resource, finished: fields.finished } : candidate));
		return Promise.resolve('done');
	}

	readTakeaway(path: string): Promise<string | null> {
		if (this.failReadsWith) return Promise.reject(this.failReadsWith);
		if (!this.resources.some((candidate) => candidate.path === path)) return Promise.resolve(null);
		return Promise.resolve(this.takeaways.get(path) ?? '');
	}
}
