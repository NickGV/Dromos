import type { LedgerRow } from '../../src/domain';
import type { LedgerLoadResult, LedgerRepository, UnreadableLedgerEvent } from '../../src/ports';

/** Ledger held in memory. `appended` keeps each batch, so a test can see what one sync wrote. */
export class InMemoryLedgerRepository implements LedgerRepository {
	readonly appended: (readonly LedgerRow[])[] = [];
	failWith: Error | null = null;

	constructor(
		private rows: readonly LedgerRow[] = [],
		private readonly unreadable: readonly UnreadableLedgerEvent[] = [],
	) {}

	readAll(): Promise<LedgerLoadResult> {
		if (this.failWith) return Promise.reject(this.failWith);
		return Promise.resolve({ rows: this.rows, unreadable: this.unreadable });
	}

	append(rows: readonly LedgerRow[]): Promise<void> {
		if (this.failWith) return Promise.reject(this.failWith);
		this.appended.push(rows);
		this.rows = [...this.rows, ...rows];
		return Promise.resolve();
	}
}
