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

/** `YYYY-MM-DD` out of a date or a date-time text, or `null`. */
export function dateOrNull(value: unknown): string | null {
	return typeof value === 'string' && DATE.test(value) ? value.slice(0, 10) : null;
}

export function positiveInteger(value: unknown): number | null {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}
