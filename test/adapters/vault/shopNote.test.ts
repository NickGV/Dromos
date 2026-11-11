import { describe, expect, it } from 'vitest';
import { parseShopNote } from '../../../src/adapters/vault/shopNote';

const NOTE = `---
type: dromos-shop
---

# Shop

Esdras's offers for Nick.

| id | offer | price | why | until |
|---|---|---|---|---|
| book-week | A book of the week | 40 | Five days of reading in a row | 2026-11-20 |
| walk | A long walk | 15 |  |  |
`;

describe('parseShopNote: the offers Esdras writes (M10 S2)', () => {
	it('reads each row of the table with its offer, price, why and last day', () => {
		expect(parseShopNote(NOTE)).toEqual({
			offers: [
				{ id: 'book-week', offer: 'A book of the week', price: 40, why: 'Five days of reading in a row', until: '2026-11-20' },
				{ id: 'walk', offer: 'A long walk', price: 15, why: null, until: null },
			],
			unreadable: [],
		});
	});

	it('matches the columns by their header names, in any order, and reads a note without a type', () => {
		const text = '| until | price | id | why | offer |\n|---|---|---|---|---|\n| 2026-11-20 | 40 | book-week | Five days | A book |\n';

		expect(parseShopNote(text).offers).toEqual([{ id: 'book-week', offer: 'A book', price: 40, why: 'Five days', until: '2026-11-20' }]);
	});

	it('reads a table the Table Editor re-padded, with alignment colons', () => {
		const text = ['| id        | offer  | price | why       | until      |', '|:----------|:------:|------:|-----------|:-----------|', '| book-week | A book |    40 | Five days | 2026-11-20 |'].join('\n');

		expect(parseShopNote(text).offers.map((entry) => entry.id)).toEqual(['book-week']);
	});

	it('reads only the first table with that header', () => {
		const text = `${NOTE}\n| id | offer | price | why | until |\n|---|---|---|---|---|\n| later | Later | 5 |  |  |\n`;

		expect(parseShopNote(text).offers.map((entry) => entry.id)).toEqual(['book-week', 'walk']);
	});

	it('skips and reports a row with a bad id, price or until, and still shows the others', () => {
		const text = `| id | offer | price | why | until |
|---|---|---|---|---|
| Book_Week | A | 40 |  |  |
| ok | B | 10 |  |  |
| cheap | C | 0 |  |  |
| float | D | 2.5 |  |  |
| words | E | forty |  |  |
| late | F | 10 |  | 20/11/2026 |
| blank |  | 10 |  |  |
| short | G | 10 |
`;

		const parsed = parseShopNote(text);

		expect(parsed.offers.map((entry) => entry.id)).toEqual(['ok']);
		expect(parsed.unreadable.map((row) => row.line)).toEqual([3, 5, 6, 7, 8, 9, 10]);
		expect(parsed.unreadable[0]).toEqual({ line: 3, text: '| Book_Week | A | 40 |  |  |' });
	});

	it('counts the first row of a repeated id, and reports the later one', () => {
		const text = '| id | offer | price | why | until |\n|---|---|---|---|---|\n| walk | A long walk | 15 |  |  |\n| walk | Another walk | 99 |  |  |\n';

		const parsed = parseShopNote(text);

		expect(parsed.offers).toEqual([{ id: 'walk', offer: 'A long walk', price: 15, why: null, until: null }]);
		expect(parsed.unreadable).toEqual([{ line: 4, text: '| walk | Another walk | 99 |  |  |' }]);
	});

	it('finds no offers in a note without that table', () => {
		expect(parseShopNote('---\ntype: dromos-shop\n---\n\nNothing yet.\n')).toEqual({ offers: [], unreadable: [] });
	});
});
