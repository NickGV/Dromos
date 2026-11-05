import type { Translator } from '../../i18n';

/** How many rows a long list shows before "View more" (missions S3). */
export const LIST_LIMIT = 6;

/** The button under a long list: "View more (N)" while folded, "View less" once expanded. */
export interface ListToggleView {
	readonly label: string;
	readonly expanded: boolean;
}

/** The rows a list shows, with its toggle only when it is longer than `LIST_LIMIT`. */
export interface LimitedRows<T> {
	readonly rows: readonly T[];
	readonly more?: ListToggleView;
}

/**
 * Every row of a list that fits or is expanded; otherwise `LIST_LIMIT` of them under "View more (N)".
 * A folded list hides its finished rows first, so open work stays in sight, and keeps its order
 * (missions A4). It fetches nothing: the rows are already there.
 */
export function limitRows<T>(rows: readonly T[], expanded: boolean, t: Translator, isDone: (row: T) => boolean): LimitedRows<T> {
	if (rows.length <= LIST_LIMIT) return { rows };
	if (expanded) return { rows, more: { label: t('list.less'), expanded: true } };
	const kept = new Set([...rows.filter((row) => !isDone(row)), ...rows.filter(isDone)].slice(0, LIST_LIMIT));
	return { rows: rows.filter((row) => kept.has(row)), more: { label: t('list.more', { count: rows.length - LIST_LIMIT }), expanded: false } };
}
