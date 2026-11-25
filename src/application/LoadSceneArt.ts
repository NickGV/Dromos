import { NO_SCENE_ART, sceneArtFrom, type SceneArt } from '../domain';
import type { PaintingSource } from '../ports';

export interface LoadSceneArtDeps {
	readonly source: PaintingSource;
}

/**
 * The paintings the scenes show (own-art S1, S4), read from the art folder when the view opens and
 * on Sync, never on a timer. A folder that cannot be read gives none, so every scene keeps its
 * drawing: nothing breaks for an image that is missing or not synced yet. Never throws.
 */
export class LoadSceneArt {
	constructor(private readonly deps: LoadSceneArtDeps) {}

	execute(): SceneArt {
		try {
			return sceneArtFrom(this.deps.source.list());
		} catch {
			return NO_SCENE_ART;
		}
	}
}
