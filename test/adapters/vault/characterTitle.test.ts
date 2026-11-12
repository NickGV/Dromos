import { describe, expect, it } from 'vitest';
import { writeCharacterTitle } from '../../../src/adapters/vault/characterTitle';
import { applyCharacterProjection } from '../../../src/adapters/vault/projections';
import type { CharacterProjection } from '../../../src/ports';
import { fakeVaultApp } from '../../fakes/fakeVaultApp';

const PATH = 'Dromos/Character.md';
const NOTE = {
	type: 'dromos-character',
	created: '2026-10-28',
	name: 'Nicolás',
	title: 'Corredor',
	level: 2,
	total_xp: 135,
	xp_to_next: 283,
	stats: { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 1 },
	game_start: '2026-11-01',
	last_sync: '2026-11-11T09:00:00Z',
	updated_by: 'esdras',
	mood: 'calm',
};
const PROJECTION: CharacterProjection = {
	level: 3,
	totalXp: 400,
	xpToNext: 520,
	stats: { fuerza: 5, vitalidad: 0, inteligencia: 25, sabiduria: 0, espiritu: 10, disciplina: 0 },
	gameStart: '2026-11-01',
	lastSync: '2026-11-12',
};

type App = Parameters<typeof writeCharacterTitle>[0];

describe('writeCharacterTitle: the chosen title in Character.md (titles S2, S5, ADR-020)', () => {
	it('writes only `title`: every other field stays as it was, `updated_by` included', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: NOTE } });

		expect(await writeCharacterTitle(app as unknown as App, PATH, 'Constructor')).toBe('saved');
		expect(app.savedFrontmatter(PATH)).toEqual({ ...NOTE, title: 'Constructor' });
	});

	it('writes nothing and answers missing when the note does not exist', async () => {
		const app = fakeVaultApp({});

		expect(await writeCharacterTitle(app as unknown as App, PATH, 'Constructor')).toBe('missing');
		expect(app.savedFrontmatter(PATH)).toBeUndefined();
	});

	it('rejects when the save fails, and the title stays as it was', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: NOTE } }, { failWritesWith: new Error('disk full') });

		await expect(writeCharacterTitle(app as unknown as App, PATH, 'Constructor')).rejects.toThrow('disk full');
		expect(app.savedFrontmatter(PATH)).toEqual(NOTE);
	});

	it('waits until the cache shows the new title, so the next read of the plaque already sees it', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: NOTE } }, { cacheFollowsWrites: false });
		const cleared: unknown[] = [];
		const timers = { set: () => 'timer', clear: (handle: unknown) => void cleared.push(handle) };
		let settled = false;

		const writing = writeCharacterTitle(app as unknown as App, PATH, 'Constructor', timers).then((result) => {
			settled = true;
			return result;
		});
		await Promise.resolve();
		expect(settled).toBe(false);

		app.refreshCache(PATH);
		expect(await writing).toBe('saved');
		expect(cleared).toEqual(['timer']);
		expect(app.listenerCount()).toBe(0);
	});

	it('the game sync’s own rewrite of Character.md keeps the chosen title', async () => {
		const app = fakeVaultApp({ [PATH]: { frontmatter: NOTE } });
		await writeCharacterTitle(app as unknown as App, PATH, 'Constructor');

		await app.fileManager.processFrontMatter({ path: PATH, stat: { ctime: 0 } }, (frontmatter) => applyCharacterProjection(frontmatter, PROJECTION));

		expect(app.savedFrontmatter(PATH)).toMatchObject({ name: 'Nicolás', title: 'Constructor', level: 3, total_xp: 400, mood: 'calm', updated_by: 'dromos' });
	});
});
