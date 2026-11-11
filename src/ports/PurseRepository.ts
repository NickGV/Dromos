import type { PurseEntry } from '../domain';

/** A row of the purse that could not be read, reported as the ledger reports its own. */
export interface UnreadablePurseLine {
	readonly path: string;
	/** 1-based line of the note. */
	readonly line: number;
	readonly text: string;
}

export interface PurseLoadResult {
	/** Every row, in the note's order; none when the note does not exist. */
	readonly entries: readonly PurseEntry[];
	readonly unreadable: readonly UnreadablePurseLine[];
}

/**
 * The purse, `<Dromos folder>/Purse.md` (M10 S3, ADR-019): the purchases and the level bonuses,
 * written by Dromos alone, each once Habitica confirmed it.
 */
export interface PurseRepository {
	/** Reads the note as it is on disk now, not as a cache last saw it: a row another device wrote counts. */
	read(): Promise<PurseLoadResult>;

	/** Adds the rows under the note's table, creating the note when it does not exist. It never edits or removes a row. */
	append(entries: readonly PurseEntry[]): Promise<void>;
}
