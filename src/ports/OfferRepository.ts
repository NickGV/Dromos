import type { Offer } from '../domain';
import type { UnreadableNoteRow } from './PurseRepository';

export interface OfferLoadResult {
	/** Every offer of the note that could be read, in its order, the first of a repeated `id` only. */
	readonly offers: readonly Offer[];
	/** The rows skipped: a bad `id`, `price` or `until`, an empty offer, or a repeated `id`. */
	readonly unreadable: readonly UnreadableNoteRow[];
}

/** Esdras's offers, `<Dromos folder>/Shop.md` (M10 S2, ADR-019). Dromos only reads it. */
export interface OfferRepository {
	/** Reads the note by its path, whatever its `type`; no offers when it does not exist. */
	load(): Promise<OfferLoadResult>;
}
