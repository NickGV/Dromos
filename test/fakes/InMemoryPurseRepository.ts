import type { PurseEntry } from '../../src/domain';
import type { PurseLoadResult, PurseRepository, UnreadablePurseLine } from '../../src/ports';

/**
 * The purse held in memory. `appended` keeps each batch; `reads` counts the reads, so a test can
 * see the purse was read again before a payment. `beforeRead` runs before each read, as another
 * device's row arriving through sync would.
 */
export class InMemoryPurseRepository implements PurseRepository {
	readonly appended: (readonly PurseEntry[])[] = [];
	reads = 0;
	failReadWith: Error | null = null;
	failAppendWith: Error | null = null;
	beforeRead: (() => void) | null = null;

	constructor(
		public entries: PurseEntry[] = [],
		private readonly unreadable: readonly UnreadablePurseLine[] = [],
	) {}

	read(): Promise<PurseLoadResult> {
		this.reads += 1;
		this.beforeRead?.();
		if (this.failReadWith) return Promise.reject(this.failReadWith);
		return Promise.resolve({ entries: [...this.entries], unreadable: this.unreadable });
	}

	append(entries: readonly PurseEntry[]): Promise<void> {
		if (this.failAppendWith) return Promise.reject(this.failAppendWith);
		this.appended.push(entries);
		this.entries = [...this.entries, ...entries];
		return Promise.resolve();
	}
}
