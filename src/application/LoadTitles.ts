import { newestFirst, type Title } from '../domain';
import type { TitleRepository, UnreadableNoteRow } from '../ports';

/** The titles as one read of `Titles.md` found them (titles S5). */
export interface TitlesReading {
	/** The readable titles, newest grant first; none when the note is missing, empty or unreadable. */
	readonly titles: readonly Title[];
	/** The rows of the note that could not be read, which the titles card names. */
	readonly unreadable: readonly UnreadableNoteRow[];
}

export interface LoadTitlesDeps {
	readonly titles: TitleRepository;
}

/**
 * Reads the titles Esdras granted (titles S3, S5, ADR-020) when the view opens and after each sync,
 * never per render. It reads the vault only, never Habitica. A note that cannot be read holds no
 * titles; it never rejects.
 */
export class LoadTitles {
	constructor(private readonly deps: LoadTitlesDeps) {}

	async execute(): Promise<TitlesReading> {
		try {
			const { titles, unreadable } = await this.deps.titles.load();
			return { titles: newestFirst(titles), unreadable };
		} catch {
			return { titles: [], unreadable: [] };
		}
	}
}
