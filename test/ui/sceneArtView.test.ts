import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART } from '../../src/domain';
import { cssUrl, portraitPaintingView, sceneArtView, scenePaintingView } from '../../src/ui/presenters/sceneArtView';

describe('scenePaintingView: what a scene needs to show its paintings (own-art S3)', () => {
	it('marks each theme that has a painting and passes its URL to the stylesheet', () => {
		expect(scenePaintingView({ light: 'app://v/wall-light.webp', dark: 'app://v/wall-dark.webp', lightVideo: null, darkVideo: null })).toEqual({
			className: 'has-art-light has-art-dark',
			style: { '--dromos-art-light': 'url("app://v/wall-light.webp")', '--dromos-art-dark': 'url("app://v/wall-dark.webp")' },
			videos: [],
		});
	});

	it('marks only the theme that has one, so the other keeps its drawing', () => {
		expect(scenePaintingView({ light: null, dark: 'app://v/desk-dark.webp', lightVideo: null, darkVideo: null })).toEqual({
			className: 'has-art-dark',
			style: { '--dromos-art-dark': 'url("app://v/desk-dark.webp")' },
			videos: [],
		});
	});

	it('plays each theme\'s video over its painting, the painting as its still frame (scene-video S2, S4)', () => {
		const view = scenePaintingView({ light: 'app://v/archive-light.webp', dark: 'app://v/archive-dark.webp', lightVideo: null, darkVideo: 'app://v/archive-dark.webm' });
		expect(view?.videos).toEqual([{ theme: 'dark', src: 'app://v/archive-dark.webm', poster: 'app://v/archive-dark.webp' }]);
		expect(view?.className).toBe('has-art-light has-art-dark');
	});

	it('gives nothing to a scene without paintings', () => {
		expect(scenePaintingView({ light: null, dark: null, lightVideo: null, darkVideo: null })).toBeNull();
	});
});

describe('sceneArtView', () => {
	it('gives each scene its view, none when no painting was found', () => {
		expect(sceneArtView(NO_SCENE_ART)).toEqual({ wall: null, desk: null, shelf: null, archive: null, shop: null, esdras: null, landscape: null });
		expect(sceneArtView({ ...NO_SCENE_ART, shop: { light: 'app://v/shop-light.webp', dark: null, lightVideo: null, darkVideo: null } }).shop?.className).toBe('has-art-light');
		expect(sceneArtView({ ...NO_SCENE_ART, shelf: { light: null, dark: 'app://v/s.webp', lightVideo: null, darkVideo: null } }).shelf?.className).toBe('has-art-dark');
		expect(sceneArtView({ ...NO_SCENE_ART, archive: { light: 'app://v/a.png', dark: null, lightVideo: null, darkVideo: null } }).archive?.className).toBe('has-art-light');
	});
});

describe('portraitPaintingView: Esdras\'s painted portrait (letter-art S2, S3)', () => {
	it('gives the URL of each theme\'s portrait, null for a theme without one', () => {
		expect(portraitPaintingView({ light: null, dark: 'app://v/esdras-dark.webp', lightVideo: null, darkVideo: null })).toEqual({ light: null, dark: 'app://v/esdras-dark.webp' });
	});

	it('never takes a video: nothing plays on Home', () => {
		expect(portraitPaintingView({ light: 'app://v/esdras-light.webp', dark: null, lightVideo: 'app://v/esdras-light.webm', darkVideo: null })).toEqual({ light: 'app://v/esdras-light.webp', dark: null });
	});

	it('gives nothing without a portrait, so the drawn scribe stays', () => {
		expect(portraitPaintingView(NO_SCENE_ART.esdras)).toBeNull();
	});
});

describe('cssUrl', () => {
	it('quotes the URL and escapes what would end the CSS string', () => {
		expect(cssUrl('app://v/Dromos/Arte/wall-dark.webp?1732540800')).toBe('url("app://v/Dromos/Arte/wall-dark.webp?1732540800")');
		expect(cssUrl('app://v/a"b\\c\nd.png')).toBe('url("app://v/a\\"b\\\\cd.png")');
	});
});
