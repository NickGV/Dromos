import type { LedgerRow } from '../domain';

/** A table row that did not parse, shown as an unreadable event. */
export interface UnreadableLedgerEvent {
	readonly path: string;
	/** 1-based line of the note. */
	readonly line: number;
	readonly text: string;
}

export interface LedgerLoadResult {
	/** Every row of every month, oldest note first. */
	readonly rows: readonly LedgerRow[];
	readonly unreadable: readonly UnreadableLedgerEvent[];
}

/** The ledger stored in the vault, one note per month under `Dromos/Ledger/`. */
export interface LedgerRepository {
	readAll(): Promise<LedgerLoadResult>;

	/**
	 * Appends rows to the note of the month of each row, creating the note when it
	 * does not exist. It only adds: no row is edited or removed.
	 */
	append(rows: readonly LedgerRow[]): Promise<void>;
}
