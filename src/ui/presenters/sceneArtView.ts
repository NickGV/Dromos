import type { ArtScene, SceneArt, ScenePainting } from '../../domain';

/**
 * How one scene shows its paintings (own-art S3): a class per theme that has one, which the
 * stylesheet keys on to hide the drawing in that theme only, and each painting's URL as a custom
 * property for the background layer.
 */
export interface ScenePaintingView {
	/** `has-art-light`, `has-art-dark`, or both. */
	readonly className: string;
	/** `--dromos-art-light` and `--dromos-art-dark`, each a CSS `url("…")`. */
	readonly style: Readonly<Record<string, string>>;
	/** The loops that play over the paintings, one per theme that has one (scene-video S1-S4). */
	readonly videos: readonly SceneVideoView[];
}

/** A theme's video and its painting, the poster it shows until it plays and whenever it cannot. */
export interface SceneVideoView {
	readonly theme: 'light' | 'dark';
	readonly src: string;
	readonly poster: string;
}

/**
 * Each scene's view, `null` for a scene without paintings. The landscape's here leaves out its dawn and
 * dusk: the scene above every screen takes `landscapeArtView`, which chooses by the time of day.
 */
export type SceneArtView = Readonly<Record<ArtScene, ScenePaintingView | null>>;

/** A CSS `url("…")` for `url`, with what would end the string escaped and line breaks dropped. */
export function cssUrl(url: string): string {
	return `url("${url.replace(/[\n\r\f]/g, '').replace(/["\\]/g, '\\$&')}")`;
}

export function scenePaintingView(painting: ScenePainting): ScenePaintingView | null {
	const classes: string[] = [];
	const style: Record<string, string> = {};
	const videos: SceneVideoView[] = [];
	if (painting.light !== null) {
		classes.push('has-art-light');
		style['--dromos-art-light'] = cssUrl(painting.light);
		if (painting.lightVideo !== null) videos.push({ theme: 'light', src: painting.lightVideo, poster: painting.light });
	}
	if (painting.dark !== null) {
		classes.push('has-art-dark');
		style['--dromos-art-dark'] = cssUrl(painting.dark);
		if (painting.darkVideo !== null) videos.push({ theme: 'dark', src: painting.darkVideo, poster: painting.dark });
	}
	return classes.length === 0 ? null : { className: classes.join(' '), style, videos };
}

export function sceneArtView(art: SceneArt): SceneArtView {
	return {
		wall: scenePaintingView(art.wall),
		desk: scenePaintingView(art.desk),
		shelf: scenePaintingView(art.shelf),
		archive: scenePaintingView(art.archive),
		shop: scenePaintingView(art.shop),
		esdras: scenePaintingView(art.esdras),
		landscape: scenePaintingView(art.landscape),
	};
}

/** Esdras's painted portrait (letter-art S2): each theme's image, `null` for a theme without one. */
export interface PortraitPaintingView {
	readonly light: string | null;
	readonly dark: string | null;
}

/**
 * The portrait's images, or `null` without any, which keeps the drawn scribe. A video beside it is never
 * taken: Home is always on screen, and nothing on it plays (letter-art S3).
 */
export function portraitPaintingView(painting: ScenePainting): PortraitPaintingView | null {
	return painting.light === null && painting.dark === null ? null : { light: painting.light, dark: painting.dark };
}
