import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { LIST_LIMIT, limitRows } from '../../src/ui/presenters/listLimit';

const en = createTranslator('en');
const es = createTranslator('es');
const rows = (count: number, done: readonly number[] = []) => Array.from({ length: count }, (_, index) => ({ index, done: done.includes(index) }));
const isDone = (row: { done: boolean }) => row.done;

describe('limitRows (missions S3)', () => {
	it('shows every row of a list of 6 or fewer, with no toggle', () => {
		expect(LIST_LIMIT).toBe(6);
		const list = rows(6);

		expect(limitRows(list, false, en, isDone)).toEqual({ rows: list });
	});

	it('folds a longer list to its first 6 rows under "View more (N)", and shows them all under "View less"', () => {
		const list = rows(9);

		expect(limitRows(list, false, en, isDone)).toEqual({ rows: list.slice(0, 6), more: { label: 'View more (3)', expanded: false } });
		expect(limitRows(list, true, en, isDone)).toEqual({ rows: list, more: { label: 'View less', expanded: true } });
		expect(limitRows(list, false, es, isDone).more?.label).toBe('Ver más (3)');
		expect(limitRows(list, true, es, isDone).more?.label).toBe('Ver menos');
	});

	it('folds the finished rows first, so open work stays in sight, and keeps the order (missions A4)', () => {
		const list = rows(9, [0, 1, 2, 3]);

		expect(limitRows(list, false, en, isDone).rows.map((row) => row.index)).toEqual([0, 4, 5, 6, 7, 8]);
	});

	it('folds to a shorter limit when the list asks for one, the toggle counting from it', () => {
		const list = rows(5);

		expect(limitRows(list, false, en, isDone, 3)).toEqual({ rows: list.slice(0, 3), more: { label: 'View more (2)', expanded: false } });
		expect(limitRows(list.slice(0, 3), false, en, isDone, 3)).toEqual({ rows: list.slice(0, 3) });
	});
});
