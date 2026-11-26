import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, sceneArtFrom } from '../../../src/domain';

const file = (name: string) => ({ name, url: `app://vault/Dromos/Arte/${name}` });
const url = (name: string) => `app://vault/Dromos/Arte/${name}`;
/** A scene's paintings with no video. */
const still = (light: string | null, dark: string | null) => ({ light, dark, lightVideo: null, darkVideo: null });

describe('sceneArtFrom: the paintings in the art folder (own-art S4)', () => {
	it('gives each scene its light and dark painting by file name', () => {
		const art = sceneArtFrom([file('wall-dark.webp'), file('wall-light.png'), file('desk-dark.jpg'), file('archive-light.webp')]);
		expect(art).toEqual({
			wall: still(url('wall-light.png'), url('wall-dark.webp')),
			desk: still(null, url('desk-dark.jpg')),
			shelf: still(null, null),
			archive: still(url('archive-light.webp'), null),
			shop: still(null, null),
			esdras: still(null, null),
			landscape: { ...still(null, null), dawn: null, dusk: null, dawnVideo: null, duskVideo: null },
		});
	});

	it('finds the shelf\'s paintings too (L16)', () => {
		expect(sceneArtFrom([file('shelf-dark.webp'), file('shelf-light.jpg')]).shelf).toEqual(still(url('shelf-light.jpg'), url('shelf-dark.webp')));
	});

	it('finds the Shop\'s paintings and their videos too (shop-art S1, S2)', () => {
		const art = sceneArtFrom([file('shop-dark.webp'), file('shop-light.png'), file('shop-dark.webm')]);
		expect(art.shop).toEqual({ light: url('shop-light.png'), dark: url('shop-dark.webp'), lightVideo: null, darkVideo: url('shop-dark.webm') });
	});

	it('finds Esdras\'s portraits too (letter-art S2)', () => {
		expect(sceneArtFrom([file('esdras-dark.webp'), file('Esdras-Light.PNG')]).esdras).toEqual(still(url('Esdras-Light.PNG'), url('esdras-dark.webp')));
	});

	it('leaves a theme without its file empty, even when the other theme has one', () => {
		expect(sceneArtFrom([file('desk-dark.webp')]).desk).toEqual(still(null, url('desk-dark.webp')));
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
		const art = sceneArtFrom([file('card-dark.webp'), file('card-light.png'), file('wall-dark.gif'), file('wall-dark copy.webp'), file('wall.webp'), file('notes.md')]);
		expect(art).toEqual(NO_SCENE_ART);
	});

	it('finds a video beside its painting, in its theme (scene-video S1, S4)', () => {
		const art = sceneArtFrom([file('archive-dark.webp'), file('archive-dark.webm'), file('archive-light.webp'), file('desk-dark.png'), file('desk-dark.mp4')]);
		expect(art.archive).toEqual({ light: url('archive-light.webp'), dark: url('archive-dark.webp'), lightVideo: null, darkVideo: url('archive-dark.webm') });
		expect(art.desk.darkVideo).toBe(url('desk-dark.mp4'));
	});

	it('takes webm before mp4 when one video has both', () => {
		expect(sceneArtFrom([file('wall-dark.webp'), file('wall-dark.mp4'), file('wall-dark.webm')]).wall.darkVideo).toBe(url('wall-dark.webm'));
	});

	it('ignores a video without its theme\'s painting, its still frame and fallback (scene-video S2)', () => {
		const art = sceneArtFrom([file('archive-light.webp'), file('archive-dark.webm'), file('desk-light.mp4')]);
		expect(art.archive).toEqual(still(url('archive-light.webp'), null));
		expect(art.desk).toEqual(still(null, null));
	});

	it('ignores other video formats', () => {
		expect(sceneArtFrom([file('wall-dark.webp'), file('wall-dark.mov'), file('wall-dark.gif')]).wall).toEqual(still(null, url('wall-dark.webp')));
	});
});

describe('sceneArtFrom: the landscape\'s four paintings (landscape-art S1, S3, S4)', () => {
	it('finds the day, night, dawn and dusk paintings by file name, whatever their case', () => {
		const art = sceneArtFrom([file('landscape-light.webp'), file('Landscape-Dark.WEBP'), file('landscape-DAWN.png'), file('landscape-dusk.jpeg')]);
		expect(art.landscape).toEqual({
			light: url('landscape-light.webp'),
			dark: url('Landscape-Dark.WEBP'),
			lightVideo: null,
			darkVideo: null,
			dawn: url('landscape-DAWN.png'),
			dusk: url('landscape-dusk.jpeg'),
			dawnVideo: null,
			duskVideo: null,
		});
	});

	it('takes webp, then png, then jpg for dawn and dusk too', () => {
		const art = sceneArtFrom([file('landscape-dawn.jpg'), file('landscape-dawn.png'), file('landscape-dawn.webp'), file('landscape-dusk.jpg'), file('landscape-dusk.png')]);
		expect(art.landscape.dawn).toBe(url('landscape-dawn.webp'));
		expect(art.landscape.dusk).toBe(url('landscape-dusk.png'));
	});

	it('finds each painting\'s loop beside it, dawn and dusk included, and ignores a loop whose painting is missing (S3)', () => {
		const art = sceneArtFrom([
			file('landscape-light.webp'),
			file('landscape-light.webm'),
			file('landscape-dark.mp4'),
			file('landscape-dawn.webp'),
			file('landscape-dawn.mp4'),
			file('Landscape-Dawn.WEBM'),
			file('landscape-dusk.webm'),
		]);
		expect(art.landscape).toEqual({
			light: url('landscape-light.webp'),
			dark: null,
			lightVideo: url('landscape-light.webm'),
			darkVideo: null,
			dawn: url('landscape-dawn.webp'),
			dusk: null,
			dawnVideo: url('Landscape-Dawn.WEBM'),
			duskVideo: null,
		});
	});

	it('keeps every other scene as it was: no dawn or dusk of their own, and nothing from the landscape', () => {
		const art = sceneArtFrom([file('landscape-light.webp'), file('landscape-dark.webp'), file('wall-dawn.webp'), file('shop-dusk.png'), file('wall-dark.webp')]);
		expect({ ...art, landscape: NO_SCENE_ART.landscape }).toEqual({ ...NO_SCENE_ART, wall: still(null, url('wall-dark.webp')) });
		expect(art.wall).not.toHaveProperty('dawn');
	});
});
