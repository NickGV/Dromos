import { boughtOffers, type PurseEntry } from '../domain';
import type { DeviceStore, PurseRepository } from '../ports';

/** Where this device keeps the purse rows of offers bought whose row the purse could not keep (L8). */
export const PENDING_OFFER_ROWS_KEY = 'offer-rows-pending';

/**
 * The purse rows of offers bought on this device that the purse could not keep yet. Until each is
 * written, its offer is neither offered nor bought again, here, as the purse would say.
 */
export function pendingOfferRows(store: DeviceStore): PurseEntry[] {
	const stored = store.read(PENDING_OFFER_ROWS_KEY);
	return Array.isArray(stored) ? stored.filter(isOfferRow) : [];
}

/** Keeps the row of an offer bought on this device until the purse can be written. */
export function rememberOfferRow(store: DeviceStore, entry: PurseEntry): void {
	keep(store, [...pendingOfferRows(store).filter((row) => row.offer !== entry.offer), entry]);
}

/**
 * Writes into the purse, whose rows are `entries`, the offer rows this device still owes; a row the
 * purse already holds (added by hand, or from another device) is only forgotten. Answers with the
 * rows written. A write that fails keeps them owed; it never rejects.
 */
export async function writePendingOfferRows(store: DeviceStore, purse: PurseRepository, entries: readonly PurseEntry[]): Promise<PurseEntry[]> {
	const pending = pendingOfferRows(store);
	if (pending.length === 0) return [];
	const bought = boughtOffers(entries);
	const missing = pending.filter((row) => row.offer !== null && !bought.has(row.offer));
	try {
		if (missing.length > 0) await purse.append(missing);
	} catch {
		keep(store, missing);
		return [];
	}
	keep(store, []);
	return missing;
}

function keep(store: DeviceStore, rows: readonly PurseEntry[]): void {
	store.write(PENDING_OFFER_ROWS_KEY, rows.length > 0 ? [...rows] : null);
}

function isOfferRow(value: unknown): value is PurseEntry {
	if (typeof value !== 'object' || value === null) return false;
	const row = value as Record<string, unknown>;
	return row.kind === 'purchase' && typeof row.offer === 'string' && typeof row.date === 'string' && typeof row.what === 'string' && typeof row.gold === 'number';
}
