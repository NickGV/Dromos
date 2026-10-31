/** Stands in for a `habitica_id` that is not text, so the Habitica check flags it instead of hiding it. */
const INVALID_ID = '[invalid]';

/**
 * True when a task has not been sent to Habitica: `habitica_id` is missing, `null` or blank
 * text. Any other value counts as linked, so Dromos never overwrites it, whatever its type.
 * The mapper (what the card shows) and the writer (what gets saved) share this rule.
 */
export function isUnsentId(value: unknown): boolean {
	return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/** The id as the domain keeps it: trimmed text, or `null` when the task was never sent. */
export function habiticaIdFrom(value: unknown): string | null {
	if (isUnsentId(value)) return null;
	if (typeof value === 'string') return value.trim();
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	return INVALID_ID;
}
