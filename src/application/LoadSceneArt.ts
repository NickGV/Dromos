import { NO_SCENE_ART, NO_WALKER_ART, sceneArtFrom, walkerArtFrom, type SceneArt, type WalkerArt } from '../domain';
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

	/**
	 * The painted walker (landscape-art S9), from the same folder and at the same moments: each stage's
	 * painting and the paintings of the objects of `objectIds`. A folder that cannot be read gives none,
	 * so the walker is drawn. Never throws.
	 */
	walker(objectIds: readonly string[]): WalkerArt {
		try {
			return walkerArtFrom(this.deps.source.list(), objectIds);
		} catch {
			return NO_WALKER_ART;
		}
	}
}
