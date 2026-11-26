import type { LandscapePainting } from '../../domain';
import type { DayPeriod } from './dayPeriod';
import { scenePaintingView, type ScenePaintingView } from './sceneArtView';

/** Which themes show a painting in place of the drawn landscape: `none`, `one` or `both`. */
export type PaintedThemes = 'none' | 'one' | 'both';

/**
 * How the scene above every screen shows the landscape's paintings (landscape-art S1, S3, S4): one
 * painting per theme, as any scene's, with its loop, and which themes are painted, so the drawing
 * is left out when both are.
 */
export interface LandscapeArtView extends ScenePaintingView {
	readonly painted: Exclude<PaintedThemes, 'none'>;
}

/** A painting and the loop that plays over it, `null` for none. */
interface Shown {
	readonly painting: string | null;
	readonly video: string | null;
}

/**
 * The landscape's view at `period`, or `null` without the day and the night paintings, which keeps
 * the drawing. The dark theme shows the night painting at every hour. The light theme tells the
 * shepherd's day (S4): the dawn, day, dusk and night paintings at their periods, the day painting
 * standing in for a missing one, and the drawing at every hour without the day painting. The loop
 * that plays is the one beside the painting shown, never another painting's (S3).
 */
export function landscapeArtView(painting: LandscapePainting, period: DayPeriod): LandscapeArtView | null {
	const light = lightOf(painting, period);
	const view = scenePaintingView({ light: light.painting, lightVideo: light.video, dark: painting.dark, darkVideo: painting.darkVideo });
	if (view === null) return null;
	return { ...view, painted: light.painting !== null && painting.dark !== null ? 'both' : 'one' };
}

/** What the light theme shows at `period`. */
function lightOf(painting: LandscapePainting, period: DayPeriod): Shown {
	if (painting.light === null) return { painting: null, video: null };
	if (period === 'dawn' && painting.dawn !== null) return { painting: painting.dawn, video: painting.dawnVideo };
	if (period === 'dusk' && painting.dusk !== null) return { painting: painting.dusk, video: painting.duskVideo };
	if (period === 'night' && painting.dark !== null) return { painting: painting.dark, video: painting.darkVideo };
	return { painting: painting.light, video: painting.lightVideo };
}
