import type { Offer } from '../../src/domain';
import type { OfferLoadResult, OfferRepository, UnreadableNoteRow } from '../../src/ports';

/** Esdras's offers held in memory, as `Shop.md` would give them. */
export class InMemoryOfferRepository implements OfferRepository {
	failWith: Error | null = null;

	constructor(
		public offers: Offer[] = [],
		private readonly unreadable: readonly UnreadableNoteRow[] = [],
	) {}

	load(): Promise<OfferLoadResult> {
		if (this.failWith) return Promise.reject(this.failWith);
		return Promise.resolve({ offers: [...this.offers], unreadable: this.unreadable });
	}
}
