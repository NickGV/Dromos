/**
 * The kinds of resource the archive files, from the note's `sourceType` (ADR-018, Q032), in the
 * order of its pigeonholes: articles, papers, videos, podcasts, pages, courses.
 */
export type ResourceKind = 'post' | 'paper' | 'video' | 'podcast' | 'tool' | 'course';

export const RESOURCE_KINDS: readonly ResourceKind[] = ['post', 'paper', 'video', 'podcast', 'tool', 'course'];

/** The heading of the section where the user writes what a resource left them (Q031), as the template writes it. */
export const TAKEAWAY_HEADING = 'Lo que me dejó';

/**
 * A `type: resource` note saved to read, watch or listen to (ADR-018): one with a `saved` date.
 * Esdras creates it; Dromos only writes `finished`.
 */
export interface Resource {
	/** Vault path of the note, used to open it. */
	readonly path: string;
	readonly title: string;
	/** The pigeonhole; `null` for a `sourceType` the archive does not file, shown as "Sin tipo". */
	readonly kind: ResourceKind | null;
	/** The author or the source, as written in the note. */
	readonly author: string | null;
	/** The link, only when it is an `http` or `https` address. */
	readonly url: string | null;
	/** Why it was saved: "Me sirve para". */
	readonly why: string | null;
	/** Local date as `YYYY-MM-DD`: the day it was saved to read. Every resource of the archive has one. */
	readonly saved: string;
	/** Local date as `YYYY-MM-DD` it was read, watched or listened to; `null` while pending. */
	readonly finished: string | null;
	/** True when at least one block of content sits under `## Lo que me dejó`. */
	readonly takeawayWritten: boolean;
}

/**
 * What the archive shows for a resource (Q031): `pending` until it has `finished`, then
 * `takeaway-missing` until `## Lo que me dejó` has text, then `processed`, which is sealed.
 */
export type ResourceState = 'pending' | 'takeaway-missing' | 'processed';

/** Text written before the resource was marked read does not make it processed: `finished` comes first. */
export function resourceState(resource: Pick<Resource, 'finished' | 'takeawayWritten'>): ResourceState {
	if (resource.finished === null) return 'pending';
	return resource.takeawayWritten ? 'processed' : 'takeaway-missing';
}

/** How a resource is consumed, which names its button and its state: read, watched or listened to. */
export type ResourceVerb = 'read' | 'watch' | 'listen';

/** Videos and courses (the vault's are video courses) are watched, podcasts listened to, the rest read. */
export function resourceVerb(kind: ResourceKind | null): ResourceVerb {
	if (kind === 'video' || kind === 'course') return 'watch';
	if (kind === 'podcast') return 'listen';
	return 'read';
}

/** Most recently saved first, then title (Spanish), then path, so the order never depends on the vault's. */
export function compareBySaved(left: Pick<Resource, 'saved' | 'title' | 'path'>, right: Pick<Resource, 'saved' | 'title' | 'path'>): number {
	return newestFirst(left.saved, right.saved) || left.title.localeCompare(right.title, 'es') || (left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

/** Most recently finished first, a resource with no `finished` last, then `compareBySaved`. */
export function compareByFinished(left: Pick<Resource, 'finished' | 'saved' | 'title' | 'path'>, right: Pick<Resource, 'finished' | 'saved' | 'title' | 'path'>): number {
	if (left.finished === null || right.finished === null) {
		if (left.finished !== right.finished) return left.finished === null ? 1 : -1;
	} else {
		const byFinished = newestFirst(left.finished, right.finished);
		if (byFinished !== 0) return byFinished;
	}
	return compareBySaved(left, right);
}

/** `YYYY-MM-DD` texts order as dates; the later one first. */
function newestFirst(left: string, right: string): number {
	return left < right ? 1 : left > right ? -1 : 0;
}
