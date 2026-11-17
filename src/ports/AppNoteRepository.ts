import type { AppNotes } from '../domain';

/**
 * The notes Kairos and Cheshbon write into the vault (Dromos ADR-022), read only: Dromos never
 * creates, edits, renames, moves or deletes them, and never adds keys to them (app-reports S3).
 */
export interface AppNoteRepository {
	/** Every note of both types, one per Kairos day and one per Cheshbon period. */
	read(): Promise<AppNotes>;
}
