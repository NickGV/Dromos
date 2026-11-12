import type { Title } from '../domain';
import type { UnreadableNoteRow } from './PurseRepository';

export interface TitleLoadResult {
	/** Every title of the note that could be read, in its order, the first of a repeated `id` only. */
	readonly titles: readonly Title[];
	/** The rows skipped: a bad `id` or `granted`, an empty title, a wrong number of cells, or a repeated `id`. */
	readonly unreadable: readonly UnreadableNoteRow[];
}

/** The titles Esdras grants, `<Dromos folder>/Titles.md` (titles S3, ADR-020). Dromos only reads it. */
export interface TitleRepository {
	/** Reads the note by its path, whatever its `type`; no titles when it does not exist. */
	load(): Promise<TitleLoadResult>;
}
