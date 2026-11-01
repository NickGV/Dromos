import type { Character } from '../domain';
import type { CharacterProjection } from './Projections';

/**
 * Outcome of reading the character note. `missing` carries the vault path that
 * was expected (for example `Dromos/Character.md`) so the view can name it (D4).
 * A note that exists but has broken or empty frontmatter is `found` with defaults.
 */
export type CharacterLoadResult =
	| { readonly kind: 'found'; readonly character: Character }
	| { readonly kind: 'missing'; readonly path: string };

/** Outcome of writing the projection into the character note. */
export type CharacterSaveResult = 'saved' | 'unchanged' | 'missing';

/** Game state stored in the vault: the character note. The ledger and the skills have their own repositories. */
export interface GameStateRepository {
	/** Reads `<vaultFolder>/Character.md`; resolves `missing` instead of throwing when the note is absent. */
	loadCharacter(): Promise<CharacterLoadResult>;

	/**
	 * Writes the derived fields (level, XP, stats) into `Character.md`. It never creates the
	 * note and never touches `name`, `title` or anything the user wrote.
	 */
	saveCharacter(projection: CharacterProjection): Promise<CharacterSaveResult>;

	/**
	 * Creates `Character.md` with `type`, `created`, an empty `name` and `title`, and the derived
	 * fields. Only an explicit rebuild calls it; a sync never makes up a note that is missing.
	 */
	createCharacter(projection: CharacterProjection, created: string): Promise<void>;
}
