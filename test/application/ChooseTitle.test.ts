import { describe, expect, it } from 'vitest';
import { ChooseTitle } from '../../src/application/ChooseTitle';
import type { Character } from '../../src/domain';
import { InMemoryGameStateRepository } from '../fakes/InMemoryGameStateRepository';
import { aTitle, InMemoryTitleRepository } from '../fakes/InMemoryTitleRepository';

const NICO: Character = {
	name: 'Nicolás',
	title: 'Corredor',
	level: 2,
	totalXp: 135,
	xpIntoLevel: 35,
	xpToNext: 283,
	stats: { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 1 },
	gameStart: '2026-11-01',
};

function setup() {
	const titles = new InMemoryTitleRepository([aTitle('corredor', '2026-11-01', { title: 'Corredor' }), aTitle('primera-campana', '2027-06-02', { title: 'Constructor' })]);
	const characters = new InMemoryGameStateRepository({ kind: 'found', character: NICO });
	return { titles, characters, choose: new ChooseTitle({ titles, characters }) };
}

describe('ChooseTitle: the plaque shows a title Esdras granted (titles S2, S3, S5)', () => {
	it('writes a granted title into Character.md, read from Titles.md as it is now', async () => {
		const { titles, characters, choose } = setup();

		expect(await choose.execute('Constructor')).toBe('saved');
		expect(characters.titles).toEqual(['Constructor']);
		expect(titles.loads).toBe(1);
	});

	it('refuses anything Esdras did not grant, and writes nothing', async () => {
		const { characters, choose } = setup();

		for (const title of ['Maestro de la memoria', 'constructor', 'primera-campana', '']) expect(await choose.execute(title)).toBe('refused');
		expect(characters.titles).toEqual([]);
	});

	it('refuses a title whose row Titles.md no longer holds', async () => {
		const { titles, characters, choose } = setup();
		titles.titles = titles.titles.filter((title) => title.id !== 'primera-campana');

		expect(await choose.execute('Constructor')).toBe('refused');
		expect(characters.titles).toEqual([]);
	});

	it('writes nothing when Titles.md cannot be read: nothing can be checked', async () => {
		const { titles, characters, choose } = setup();
		titles.failWith = new Error('disk');

		expect(await choose.execute('Constructor')).toBe('failed');
		expect(characters.titles).toEqual([]);
	});

	it('answers failed when the write fails, and the title stays as it was', async () => {
		const { characters, choose } = setup();
		characters.failTitleWith = new Error('disk full');

		expect(await choose.execute('Constructor')).toBe('failed');
		expect(await characters.loadCharacter()).toEqual({ kind: 'found', character: NICO });
	});

	it('answers missing when Character.md is gone, and creates nothing', async () => {
		const { titles } = setup();
		const characters = new InMemoryGameStateRepository({ kind: 'missing', path: 'Dromos/Character.md' });

		expect(await new ChooseTitle({ titles, characters }).execute('Constructor')).toBe('missing');
		expect(characters.created).toEqual([]);
	});
});
