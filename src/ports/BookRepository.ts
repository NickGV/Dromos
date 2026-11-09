import type { Book } from '../domain';

/**
 * Books stored in the vault: every `type: book` note (ADR-016). Reading only for now;
 * the state changes Dromos may make ("Empezar a leer", "Terminar") are added here with M7's U4.
 */
export interface BookRepository {
	/** Every book, sorted by title then path, whatever its folder or status. */
	list(): Promise<readonly Book[]>;
}
