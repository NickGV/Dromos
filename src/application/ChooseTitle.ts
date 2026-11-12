import { isGrantedTitle } from '../domain';
import type { GameStateRepository, TitleRepository } from '../ports';

/**
 * How choosing a title ended (titles S5): written; refused, since Esdras did not grant it; `missing`,
 * with no `Character.md` to write; or failed, `Titles.md` or the write failed. Only `saved` changed anything.
 */
export type ChooseTitleOutcome = 'saved' | 'refused' | 'missing' | 'failed';

export interface ChooseTitleDeps {
	/** `Titles.md`, read again at each choice: what the card showed may be gone. */
	readonly titles: TitleRepository;
	readonly characters: Pick<GameStateRepository, 'saveTitle'>;
}

/**
 * Writes the chosen title into `title` of `Character.md` (titles S2, ADR-020): the only value Dromos
 * ever writes there, and only the text of a title `Titles.md` holds now. Anything else is refused
 * and nothing is written. It sends nothing to Habitica. Never rejects.
 */
export class ChooseTitle {
	constructor(private readonly deps: ChooseTitleDeps) {}

	async execute(title: string): Promise<ChooseTitleOutcome> {
		try {
			const { titles } = await this.deps.titles.load();
			if (!isGrantedTitle(titles, title)) return 'refused';
			return await this.deps.characters.saveTitle(title);
		} catch {
			return 'failed';
		}
	}
}
