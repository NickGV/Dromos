import { describe, expect, it } from 'vitest';
import { parseTitlesNote } from '../../../src/adapters/vault/titlesNote';

const NOTE = `---
type: dromos-titles
---

# Titles

The titles Esdras granted Nick.

| id | title | feat | granted | why |
|---|---|---|---|---|
| corredor | Corredor | Empezar el camino. | 2026-11-01 | Todo camino empieza con un paso. |
| primera-campana | Constructor | Terminar la primera campaña. | 2027-06-02 | Lo llevaste hasta el final. |
`;

describe('parseTitlesNote: the titles Esdras grants (titles S3, ADR-020)', () => {
	it('reads each row of the table with its id, title, feat, day and why', () => {
		expect(parseTitlesNote(NOTE)).toEqual({
			titles: [
				{ id: 'corredor', title: 'Corredor', feat: 'Empezar el camino.', granted: '2026-11-01', why: 'Todo camino empieza con un paso.' },
				{ id: 'primera-campana', title: 'Constructor', feat: 'Terminar la primera campaña.', granted: '2027-06-02', why: 'Lo llevaste hasta el final.' },
			],
			unreadable: [],
		});
	});

	it('matches the columns by their header names, in any order, and reads a note without a type', () => {
		const text = '| granted | why | title | id | feat |\n|---|---|---|---|---|\n| 2026-11-01 | Un paso. | Corredor | corredor | Empezar el camino. |\n';

		expect(parseTitlesNote(text).titles).toEqual([{ id: 'corredor', title: 'Corredor', feat: 'Empezar el camino.', granted: '2026-11-01', why: 'Un paso.' }]);
	});

	it('reads a row with no feat or no why, which the card leaves out', () => {
		const text = '| id | title | feat | granted | why |\n|---|---|---|---|---|\n| corredor | Corredor |  | 2026-11-01 |  |\n';

		expect(parseTitlesNote(text).titles).toEqual([{ id: 'corredor', title: 'Corredor', feat: null, granted: '2026-11-01', why: null }]);
	});

	it('names and skips a row it cannot read: a bad id, no title, a day that is not a real YYYY-MM-DD, or a wrong number of cells', () => {
		const text = [
			'| id | title | feat | granted | why |',
			'|---|---|---|---|---|',
			'| corredor | Corredor | Empezar. | 2026-11-01 | Un paso. |',
			'| Lector | Lector | Diez libros. | 2027-03-14 | Leer. |',
			'| sin-titulo |  | Algo. | 2027-03-14 | Nada. |',
			'| tarde | Tarde | Algo. | 2027-02-29 | Nada. |',
			'| corta | Corta | 2027-03-14 |',
			'| constructor | Constructor | Una campaña. | 2027-06-02 | Hasta el final. |',
		].join('\n');

		const { titles, unreadable } = parseTitlesNote(text);

		expect(titles.map((title) => title.id)).toEqual(['corredor', 'constructor']);
		expect(unreadable).toEqual([
			{ line: 4, text: '| Lector | Lector | Diez libros. | 2027-03-14 | Leer. |' },
			{ line: 5, text: '| sin-titulo |  | Algo. | 2027-03-14 | Nada. |' },
			{ line: 6, text: '| tarde | Tarde | Algo. | 2027-02-29 | Nada. |' },
			{ line: 7, text: '| corta | Corta | 2027-03-14 |' },
		]);
	});

	it('counts the first row of a repeated id and names the later one', () => {
		const text = '| id | title | feat | granted | why |\n|---|---|---|---|---|\n| corredor | Corredor | Empezar. | 2026-11-01 | Uno. |\n| corredor | Otro | Otra vez. | 2026-12-01 | Dos. |\n';

		expect(parseTitlesNote(text)).toEqual({
			titles: [{ id: 'corredor', title: 'Corredor', feat: 'Empezar.', granted: '2026-11-01', why: 'Uno.' }],
			unreadable: [{ line: 4, text: '| corredor | Otro | Otra vez. | 2026-12-01 | Dos. |' }],
		});
	});

	it('has no titles when the note has no such table', () => {
		expect(parseTitlesNote('# Titles\n\nNone yet.\n')).toEqual({ titles: [], unreadable: [] });
		expect(parseTitlesNote('| id | title | feat | granted | why |\n|---|---|---|---|---|\n')).toEqual({ titles: [], unreadable: [] });
	});
});
