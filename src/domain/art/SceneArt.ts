/** The scenes that can show a painting from the vault (own-art S2): the Library's wall and desk, and the archive room. */
export const ART_SCENES = ['wall', 'desk', 'archive'] as const;
export type ArtScene = (typeof ART_SCENES)[number];

/** One scene's paintings: the URL Obsidian serves each file at, `null` for a theme without one. */
export interface ScenePainting {
	readonly light: string | null;
	readonly dark: string | null;
}

export type SceneArt = Readonly<Record<ArtScene, ScenePainting>>;

/** A file of the art folder: its name and the URL Obsidian serves it at. */
export interface ArtFile {
	readonly name: string;
	readonly url: string;
}

const NONE: ScenePainting = { light: null, dark: null };

/** No painting anywhere: every scene keeps its drawing. */
export const NO_SCENE_ART: SceneArt = { wall: NONE, desk: NONE, archive: NONE };

/** The formats a painting may have, in the order one is chosen when a painting has several files; `jpeg` is `jpg`. */
const EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;

/**
 * The paintings found among the files of the art folder (own-art S4): `<scene>-light.<ext>` and
 * `<scene>-dark.<ext>`, with `<ext>` one of `webp`, `png`, `jpg` (or `jpeg`), names in any case.
 * When one painting has several files, webp wins, then png, then jpg. A theme without its file
 * stays `null`, even when the other theme has one; any other file is ignored.
 */
export function sceneArtFrom(files: readonly ArtFile[]): SceneArt {
	const byName = new Map<string, string>();
	for (const file of files) {
		const name = file.name.toLowerCase();
		if (!byName.has(name)) byName.set(name, file.url);
	}
	const painting = (scene: ArtScene, theme: 'light' | 'dark'): string | null => {
		for (const extension of EXTENSIONS) {
			const url = byName.get(`${scene}-${theme}.${extension}`);
			if (url !== undefined) return url;
		}
		return null;
	};
	const sceneOf = (scene: ArtScene): ScenePainting => ({ light: painting(scene, 'light'), dark: painting(scene, 'dark') });
	return { wall: sceneOf('wall'), desk: sceneOf('desk'), archive: sceneOf('archive') };
}
