/**
 * What can show a painting from the vault (own-art S2): the Library's wall, desk and shelf, the archive
 * room, the Shop's stall (shop-art S1), named `shop` in the art folder, Esdras's portrait in his
 * letter (letter-art S2), `esdras`, and the landscape above every screen (landscape-art S1).
 */
export const ART_SCENES = ['wall', 'desk', 'shelf', 'archive', 'shop', 'esdras', 'landscape'] as const;
export type ArtScene = (typeof ART_SCENES)[number];

/**
 * One scene's paintings, and the short loop that plays over each (scene-video S1): the URL Obsidian
 * serves each file at, `null` for a theme without one. A video is only ever set beside its theme's
 * painting, its still frame and fallback (scene-video S2).
 */
export interface ScenePainting {
	readonly light: string | null;
	readonly dark: string | null;
	readonly lightVideo: string | null;
	readonly darkVideo: string | null;
}

/**
 * The landscape's paintings (landscape-art S1, S4): the day (`light`) and the night (`dark`), and the
 * light theme's dawn and dusk, `null` without one, each with its own loop (S3), set only beside it.
 */
export interface LandscapePainting extends ScenePainting {
	readonly dawn: string | null;
	readonly dusk: string | null;
	readonly dawnVideo: string | null;
	readonly duskVideo: string | null;
}

/** Every scene's paintings, the landscape with its dawn and dusk. */
export interface SceneArt extends Readonly<Record<ArtScene, ScenePainting>> {
	readonly landscape: LandscapePainting;
}

/** A file of the art folder: its name and the URL Obsidian serves it at. */
export interface ArtFile {
	readonly name: string;
	readonly url: string;
}

const NONE: ScenePainting = { light: null, dark: null, lightVideo: null, darkVideo: null };

/** No painting anywhere: every scene keeps its drawing. */
export const NO_SCENE_ART: SceneArt = { wall: NONE, desk: NONE, shelf: NONE, archive: NONE, shop: NONE, esdras: NONE, landscape: { ...NONE, dawn: null, dusk: null, dawnVideo: null, duskVideo: null } };

/** The formats a painting may have, in the order one is chosen when a painting has several files; `jpeg` is `jpg`. */
const EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;

/** The formats a video may have, in the same order of choice (scene-video S1). */
const VIDEO_EXTENSIONS = ['webm', 'mp4'] as const;

/**
 * The paintings found among the files of the art folder (own-art S4): `<scene>-light.<ext>` and
 * `<scene>-dark.<ext>`, with `<ext>` one of `webp`, `png`, `jpg` (or `jpeg`), names in any case.
 * When one painting has several files, webp wins, then png, then jpg. A theme without its file
 * stays `null`, even when the other theme has one; any other file is ignored. Beside a painting, a
 * `<scene>-<theme>.webm` (or `.mp4`, webm first) is its video (scene-video S1); a video whose
 * theme has no painting is ignored (S2). The landscape also has `landscape-dawn` and `landscape-dusk`,
 * with their videos, by the same rules (landscape-art S3, S4); no other scene has them.
 */
export function sceneArtFrom(files: readonly ArtFile[]): SceneArt {
	const byName = new Map<string, string>();
	for (const file of files) {
		const name = file.name.toLowerCase();
		if (!byName.has(name)) byName.set(name, file.url);
	}
	const first = (scene: ArtScene, theme: 'light' | 'dark' | 'dawn' | 'dusk', extensions: readonly string[]): string | null => {
		for (const extension of extensions) {
			const url = byName.get(`${scene}-${theme}.${extension}`);
			if (url !== undefined) return url;
		}
		return null;
	};
	const sceneOf = (scene: ArtScene): ScenePainting => {
		const light = first(scene, 'light', EXTENSIONS);
		const dark = first(scene, 'dark', EXTENSIONS);
		return {
			light,
			dark,
			lightVideo: light === null ? null : first(scene, 'light', VIDEO_EXTENSIONS),
			darkVideo: dark === null ? null : first(scene, 'dark', VIDEO_EXTENSIONS),
		};
	};
	const dawn = first('landscape', 'dawn', EXTENSIONS);
	const dusk = first('landscape', 'dusk', EXTENSIONS);
	const landscape: LandscapePainting = {
		...sceneOf('landscape'),
		dawn,
		dusk,
		dawnVideo: dawn === null ? null : first('landscape', 'dawn', VIDEO_EXTENSIONS),
		duskVideo: dusk === null ? null : first('landscape', 'dusk', VIDEO_EXTENSIONS),
	};
	return { wall: sceneOf('wall'), desk: sceneOf('desk'), shelf: sceneOf('shelf'), archive: sceneOf('archive'), shop: sceneOf('shop'), esdras: sceneOf('esdras'), landscape };
}
