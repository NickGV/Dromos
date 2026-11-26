import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, type LandscapePainting } from '../../src/domain';
import type { DayPeriod } from '../../src/ui/presenters/dayPeriod';
import { landscapeArtView } from '../../src/ui/presenters/landscapeArtView';

const DAY = 'app://v/landscape-light.webp';
const NIGHT = 'app://v/landscape-dark.webp';
const DAWN = 'app://v/landscape-dawn.webp';
const DUSK = 'app://v/landscape-dusk.webp';
const PERIODS: readonly DayPeriod[] = ['dawn', 'day', 'dusk', 'night'];

const paintings = (overrides: Partial<LandscapePainting> = {}): LandscapePainting => ({ light: DAY, dark: NIGHT, lightVideo: null, darkVideo: null, dawn: DAWN, dusk: DUSK, dawnVideo: null, duskVideo: null, ...overrides });
const css = (url: string): string => `url("${url}")`;

describe('landscapeArtView: the light theme tells the shepherd\'s day (landscape-art S4)', () => {
	it('shows the painting of the current period: dawn, day, dusk and, at night, the night painting', () => {
		expect(landscapeArtView(paintings(), 'dawn')?.style['--dromos-art-light']).toBe(css(DAWN));
		expect(landscapeArtView(paintings(), 'day')?.style['--dromos-art-light']).toBe(css(DAY));
		expect(landscapeArtView(paintings(), 'dusk')?.style['--dromos-art-light']).toBe(css(DUSK));
		expect(landscapeArtView(paintings(), 'night')?.style['--dromos-art-light']).toBe(css(NIGHT));
	});

	it('falls back to the day painting without the dawn, dusk or night one', () => {
		const dayOnly = paintings({ dark: null, dawn: null, dusk: null });
		for (const period of PERIODS) expect(landscapeArtView(dayOnly, period)?.style['--dromos-art-light'], period).toBe(css(DAY));
	});

	it('keeps the drawing at every hour without the day painting, whatever else there is', () => {
		const noDay = paintings({ light: null });
		for (const period of PERIODS) {
			const view = landscapeArtView(noDay, period);
			expect(view?.className, period).toBe('has-art-dark');
			expect(view?.style, period).not.toHaveProperty('--dromos-art-light');
		}
	});
});

describe('landscapeArtView: the dark theme keeps its night (landscape-art S4)', () => {
	it('shows the night painting at every hour', () => {
		for (const period of PERIODS) expect(landscapeArtView(paintings(), period)?.style['--dromos-art-dark'], period).toBe(css(NIGHT));
	});

	it('keeps the drawing in the dark theme without the night painting', () => {
		for (const period of PERIODS) {
			const view = landscapeArtView(paintings({ dark: null }), period);
			expect(view?.className, period).toBe('has-art-light');
			expect(view?.style, period).not.toHaveProperty('--dromos-art-dark');
		}
	});
});

describe('landscapeArtView: the drawing and the loops (landscape-art S3, S5)', () => {
	it('leaves the drawing out when both themes are painted, and keeps it for the unpainted theme otherwise', () => {
		expect(landscapeArtView(paintings(), 'day')).toMatchObject({ className: 'has-art-light has-art-dark', painted: 'both' });
		expect(landscapeArtView(paintings({ dark: null }), 'night')).toMatchObject({ className: 'has-art-light', painted: 'one' });
		expect(landscapeArtView(paintings({ light: null }), 'day')).toMatchObject({ className: 'has-art-dark', painted: 'one' });
	});

	it('gives nothing without the day or the night painting, so the landscape stays drawn', () => {
		expect(landscapeArtView(NO_SCENE_ART.landscape, 'day')).toBeNull();
		for (const period of PERIODS) expect(landscapeArtView(paintings({ light: null, dark: null }), period), period).toBeNull();
	});

	it('plays the loop of the painting shown, over it: dawn\'s at dawn, dusk\'s at dusk, the night\'s at night (S3)', () => {
		const looped = paintings({ lightVideo: 'app://v/landscape-light.webm', darkVideo: 'app://v/landscape-dark.webm', dawnVideo: 'app://v/landscape-dawn.webm', duskVideo: 'app://v/landscape-dusk.mp4' });
		const dark = { theme: 'dark', src: 'app://v/landscape-dark.webm', poster: NIGHT };
		expect(landscapeArtView(looped, 'dawn')?.videos).toEqual([{ theme: 'light', src: 'app://v/landscape-dawn.webm', poster: DAWN }, dark]);
		expect(landscapeArtView(looped, 'day')?.videos).toEqual([{ theme: 'light', src: 'app://v/landscape-light.webm', poster: DAY }, dark]);
		expect(landscapeArtView(looped, 'dusk')?.videos).toEqual([{ theme: 'light', src: 'app://v/landscape-dusk.mp4', poster: DUSK }, dark]);
		expect(landscapeArtView(looped, 'night')?.videos).toEqual([{ theme: 'light', src: 'app://v/landscape-dark.webm', poster: NIGHT }, dark]);
	});

	it('plays the day painting\'s own loop where it stands in for a missing painting, never another painting\'s (S3)', () => {
		const day = [{ theme: 'light', src: 'app://v/landscape-light.webm', poster: DAY }];
		expect(landscapeArtView(paintings({ dark: null, dawn: null, dusk: null, lightVideo: 'app://v/landscape-light.webm' }), 'dawn')?.videos).toEqual(day);
		expect(landscapeArtView(paintings({ dark: null, dawn: null, dusk: null, lightVideo: 'app://v/landscape-light.webm' }), 'night')?.videos).toEqual(day);
		expect(landscapeArtView(paintings({ dusk: null, duskVideo: 'app://v/landscape-dusk.webm' }), 'dusk')?.videos).toEqual([]);
		expect(landscapeArtView(paintings({ dawnVideo: 'app://v/landscape-dawn.webm' }), 'day')?.videos).toEqual([]);
	});
});
