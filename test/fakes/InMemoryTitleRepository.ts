import type { Title } from '../../src/domain';
import type { TitleLoadResult, TitleRepository, UnreadableNoteRow } from '../../src/ports';

/** The titles Esdras granted, held in memory, as `Titles.md` would give them. `loads` counts reads. */
export class InMemoryTitleRepository implements TitleRepository {
	failWith: Error | null = null;
	loads = 0;

	constructor(
		public titles: Title[] = [],
		private readonly unreadable: readonly UnreadableNoteRow[] = [],
	) {}

	load(): Promise<TitleLoadResult> {
		this.loads += 1;
		if (this.failWith) return Promise.reject(this.failWith);
		return Promise.resolve({ titles: [...this.titles], unreadable: this.unreadable });
	}
}

/** A granted title; its text is its id capitalized unless given. */
export function aTitle(id: string, granted: string, fields: Partial<Omit<Title, 'id' | 'granted'>> = {}): Title {
	return { id, title: fields.title ?? id.charAt(0).toUpperCase() + id.slice(1), feat: fields.feat ?? null, granted, why: fields.why ?? null };
}
