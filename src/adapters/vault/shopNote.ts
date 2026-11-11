import { isOfferId, type Offer } from '../../domain';
import { findTable } from './markdownTable';
import type { UnreadablePurseRow } from './purseNote';

export interface ParsedShop {
	readonly offers: readonly Offer[];
	readonly unreadable: readonly UnreadablePurseRow[];
}

/** The offers' columns (ADR-019); Esdras may write them in any order. */
const COLUMNS = ['id', 'offer', 'price', 'why', 'until'] as const;
const PRICE = /^[1-9]\d*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads Esdras's offers (M10 S2): the first table of the note with the shop's header, its columns
 * matched by name. A row with a bad `id` (lowercase letters, digits, hyphens), `price` (whole gold
 * above 0) or `until` (`YYYY-MM-DD` or empty), or with no offer, is skipped and reported; with a
 * repeated `id` the first row counts and the later one is reported. The other rows still read.
 */
export function parseShopNote(text: string): ParsedShop {
	const offers: Offer[] = [];
	const unreadable: UnreadablePurseRow[] = [];
	const seen = new Set<string>();
	for (const row of findTable(text, COLUMNS)?.rows ?? []) {
		const offer = row.cells ? offerFrom(row.cells) : null;
		if (offer === null || seen.has(offer.id)) {
			unreadable.push({ line: row.line, text: row.text });
			continue;
		}
		seen.add(offer.id);
		offers.push(offer);
	}
	return { offers, unreadable };
}

function offerFrom(cells: Readonly<Record<string, string>>): Offer | null {
	const { id = '', offer = '', price = '', why = '', until = '' } = cells;
	if (!isOfferId(id) || offer === '' || !PRICE.test(price)) return null;
	if (until !== '' && !DATE.test(until)) return null;
	return { id, offer, price: Number(price), why: why === '' ? null : why, until: until === '' ? null : until };
}
