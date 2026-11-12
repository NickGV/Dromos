import { describe, expect, it } from 'vitest';
import { isGrantedTitle, newestFirst, type Title } from '../../../src/domain';

const title = (id: string, granted: string, name = id): Title => ({ id, title: name, feat: null, granted, why: null });

describe('newestFirst: the earned titles, newest grant first (titles S5)', () => {
	it('orders the titles by their grant day, the newest first, whatever the note’s order', () => {
		const titles = [title('corredor', '2026-11-01'), title('perseverante', '2027-10-21'), title('lector', '2027-03-14')];

		expect(newestFirst(titles).map((entry) => entry.id)).toEqual(['perseverante', 'lector', 'corredor']);
		expect(titles.map((entry) => entry.id)).toEqual(['corredor', 'perseverante', 'lector']);
	});

	it('puts the later row first when two titles share a day: Esdras adds rows at the end', () => {
		expect(newestFirst([title('a', '2027-03-14'), title('b', '2027-03-14'), title('c', '2026-11-01')]).map((entry) => entry.id)).toEqual(['b', 'a', 'c']);
	});
});

describe('isGrantedTitle: only a title Esdras granted can be chosen (titles S2, S3)', () => {
	const titles = [title('corredor', '2026-11-01', 'Corredor'), title('primera-campana', '2027-06-02', 'Constructor')];

	it('is true for the text of a granted title, as it is read', () => {
		expect(isGrantedTitle(titles, 'Constructor')).toBe(true);
	});

	it('is false for anything else: another text, another case, an id, an empty text', () => {
		for (const value of ['Maestro', 'constructor', 'primera-campana', '', ' Constructor']) expect(isGrantedTitle(titles, value)).toBe(false);
	});
});
