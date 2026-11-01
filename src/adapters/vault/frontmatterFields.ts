/** Small readers for frontmatter values: a wrong type or an odd value falls back, never throws. */

const DATE = /^\d{4}-\d{2}-\d{2}/;

export function fileName(path: string): string {
	return (path.split('/').pop() ?? path).replace(/\.md$/, '');
}

export function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export function nonEmpty(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

export function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | null {
	return allowed.find((candidate) => candidate === value) ?? null;
}

/** `YYYY-MM-DD` out of a date or a date-time text (or a `Date`, read as its local day), or `null`. */
export function dateOrNull(value: unknown): string | null {
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : localDay(value);
	return typeof value === 'string' && DATE.test(value) ? value.slice(0, 10) : null;
}

/** A positive whole number, written as a number or as digits in a text; anything else is `null`. */
export function positiveInteger(value: unknown): number | null {
	const number = typeof value === 'string' && /^\s*\d+\s*$/.test(value) ? Number(value) : value;
	return typeof number === 'number' && Number.isInteger(number) && number > 0 ? number : null;
}

function localDay(date: Date): string {
	const two = (n: number): string => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}`;
}
