import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, sceneArtFrom } from '../../../src/domain';

const file = (name: string) => ({ name, url: `app://vault/Dromos/Arte/${name}` });

describe('sceneArtFrom: the paintings in the art folder (own-art S4)', () => {
	it('gives each scene its light and dark painting by file name', () => {
		const art = sceneArtFrom([file('wall-dark.webp'), file('wall-light.png'), file('desk-dark.jpg'), file('archive-light.webp')]);
		expect(art).toEqual({
			wall: { light: 'app://vault/Dromos/Arte/wall-light.png', dark: 'app://vault/Dromos/Arte/wall-dark.webp' },
			desk: { light: null, dark: 'app://vault/Dromos/Arte/desk-dark.jpg' },
			archive: { light: 'app://vault/Dromos/Arte/archive-light.webp', dark: null },
		});
	});

	it('leaves a theme without its file empty, even when the other theme has one', () => {
		expect(sceneArtFrom([file('desk-dark.webp')]).desk).toEqual({ light: null, dark: 'app://vault/Dromos/Arte/desk-dark.webp' });
	});

	it('finds nothing in an empty folder', () => {
		expect(sceneArtFrom([])).toEqual(NO_SCENE_ART);
	});

	it('takes webp, then png, then jpg when one painting has several files', () => {
		expect(sceneArtFrom([file('wall-dark.jpg'), file('wall-dark.png'), file('wall-dark.webp')]).wall.dark).toBe('app://vault/Dromos/Arte/wall-dark.webp');
		expect(sceneArtFrom([file('wall-dark.jpg'), file('wall-dark.png')]).wall.dark).toBe('app://vault/Dromos/Arte/wall-dark.png');
	});

	it('takes .jpeg as jpg, the name image generators save with', () => {
		expect(sceneArtFrom([file('archive-dark.jpeg')]).archive.dark).toBe('app://vault/Dromos/Arte/archive-dark.jpeg');
	});

	it('matches names whatever their case', () => {
		expect(sceneArtFrom([file('Wall-Dark.WEBP')]).wall.dark).toBe('app://vault/Dromos/Arte/Wall-Dark.WEBP');
	});

	it('ignores other scenes, other formats and other names', () => {
		const art = sceneArtFrom([file('shelf-dark.webp'), file('card-light.png'), file('wall-dark.gif'), file('wall-dark copy.webp'), file('wall.webp'), file('notes.md')]);
		expect(art).toEqual(NO_SCENE_ART);
	});
});
