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
}

/** Each scene's view, `null` for a scene without paintings. */
export type SceneArtView = Readonly<Record<ArtScene, ScenePaintingView | null>>;

/** A CSS `url("…")` for `url`, with what would end the string escaped and line breaks dropped. */
export function cssUrl(url: string): string {
	return `url("${url.replace(/[\n\r\f]/g, '').replace(/["\\]/g, '\\$&')}")`;
}

export function scenePaintingView(painting: ScenePainting): ScenePaintingView | null {
	const classes: string[] = [];
	const style: Record<string, string> = {};
	if (painting.light !== null) {
		classes.push('has-art-light');
		style['--dromos-art-light'] = cssUrl(painting.light);
	}
	if (painting.dark !== null) {
		classes.push('has-art-dark');
		style['--dromos-art-dark'] = cssUrl(painting.dark);
	}
	return classes.length === 0 ? null : { className: classes.join(' '), style };
}

export function sceneArtView(art: SceneArt): SceneArtView {
	return { wall: scenePaintingView(art.wall), desk: scenePaintingView(art.desk), shelf: scenePaintingView(art.shelf), archive: scenePaintingView(art.archive) };
}
