import type { Character } from '../domain';

/**
 * Outcome of reading the character note. `missing` carries the vault path that
 * was expected (for example `Dromos/Character.md`) so the view can name it (D4).
 * A note that exists but has broken or empty frontmatter is `found` with defaults.
 */
export type CharacterLoadResult =
	| { readonly kind: 'found'; readonly character: Character }
	| { readonly kind: 'missing'; readonly path: string };

/** Game state stored in the vault. Minimal M1 version: no ledger yet. */
export interface GameStateRepository {
	/** Reads `<vaultFolder>/Character.md`; resolves `missing` instead of throwing when the note is absent. */
	loadCharacter(): Promise<CharacterLoadResult>;
}
