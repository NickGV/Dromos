import type { Resource } from '../domain';

/** What "Marcar como leído" did in a resource note. */
export type ResourceWriteResult =
	/** The note was written. */
	| 'done'
	/** No note at that path. */
	| 'not-found'
	/** The note exists but its `type` is no longer `resource`: nothing was written. */
	| 'not-a-resource'
	/** The note already has a `finished` date, which is kept: nothing was written. */
	| 'already-finished';

/** What "Marcar como leído" writes into a resource note. */
export interface MarkFinishedFields {
	/** Local date as `YYYY-MM-DD`. */
	readonly finished: string;
}

/**
 * The resources of the archive (ADR-018): every `type: resource` note with a `saved` date, but the
 * `reference` ones and the templates. Dromos writes only `finished`, with "Marcar como leído":
 * never another key, never the body, and nothing in Habitica (Q033, Q034).
 */
export interface ResourceRepository {
	/** Every resource of the archive, the most recently saved first (`compareBySaved`). */
	list(): Promise<readonly Resource[]>;
	/** Writes `finished` into the resource at `path`, unless the note already has one. */
	markFinished(path: string, fields: MarkFinishedFields): Promise<ResourceWriteResult>;
	/**
	 * What the user wrote under `## Lo que me dejó`, for the card to show read-only: the markdown
	 * under the heading, sub-headings included, trimmed; `''` when the section is missing or empty.
	 * `null` for a path with no resource note. It never decides the seal, which comes from the cache.
	 */
	readTakeaway(path: string): Promise<string | null>;
}
