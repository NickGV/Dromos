import { describe, expect, it } from 'vitest';
import { LoadSceneArt } from '../../src/application/LoadSceneArt';
import { NO_SCENE_ART, NO_WALKER_ART } from '../../src/domain';
import type { Painting, PaintingSource } from '../../src/ports';

const source = (paintings: readonly Painting[]): PaintingSource => ({ list: () => paintings });

describe('LoadSceneArt: the paintings for the scenes (own-art S1, S4)', () => {
	it('reads the art folder each time, so a painting added since shows', () => {
		let paintings: readonly Painting[] = [];
		const load = new LoadSceneArt({ source: { list: () => paintings } });
		expect(load.execute()).toEqual(NO_SCENE_ART);
		paintings = [{ name: 'wall-dark.webp', url: 'app://vault/wall-dark.webp' }];
		expect(load.execute().wall.dark).toBe('app://vault/wall-dark.webp');
	});

	it('gives no paintings when the folder cannot be read, so every scene keeps its drawing', () => {
		const failing: PaintingSource = {
			list: () => {
				throw new Error('unreadable');
			},
		};
		expect(new LoadSceneArt({ source: failing }).execute()).toEqual(NO_SCENE_ART);
	});

	it('reads the walker\'s paintings from the same folder each time, and none when it cannot be read (landscape-art S9)', () => {
		let paintings: readonly Painting[] = [];
		const load = new LoadSceneArt({ source: { list: () => paintings } });
		expect(load.walker(['atleta'])).toEqual(NO_WALKER_ART);
		paintings = [
			{ name: 'walker-runner.webp', url: 'app://vault/walker-runner.webp' },
			{ name: 'object-atleta.png', url: 'app://vault/object-atleta.png' },
		];
		expect(load.walker(['atleta'])).toEqual({ stages: { runner: 'app://vault/walker-runner.webp' }, objects: { atleta: 'app://vault/object-atleta.png' } });

		const failing: PaintingSource = {
			list: () => {
				throw new Error('unreadable');
			},
		};
		expect(new LoadSceneArt({ source: failing }).walker(['atleta'])).toEqual(NO_WALKER_ART);
	});

	it('passes the files on as the source lists them', () => {
		const art = new LoadSceneArt({ source: source([{ name: 'desk-light.png', url: 'app://vault/desk-light.png' }]) }).execute();
		expect(art.desk).toEqual({ light: 'app://vault/desk-light.png', dark: null, lightVideo: null, darkVideo: null });
	});
});
