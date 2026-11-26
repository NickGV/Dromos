import { STAGE_IDS, type StageId } from '../character/Stage';
import { artFileFinder, type ArtFile } from './SceneArt';

/**
 * The user's painting of the walker on the road (landscape-art S9): one painting per stage and one per
 * skill object, each the URL Obsidian serves it at. Only the paintings found are listed: a stage or an
 * object without one is left out, and the walker draws it.
 */
export interface WalkerArt {
	readonly stages: Readonly<Partial<Record<StageId, string>>>;
	/** By skill id. */
	readonly objects: Readonly<Record<string, string>>;
}

/** No painted walker: every stage and every object is drawn. */
export const NO_WALKER_ART: WalkerArt = { stages: {}, objects: {} };

/**
 * The walker's paintings among the files of the art folder: `walker-<stage>.<ext>` for each of the twelve
 * stages and `object-<skill>.<ext>` for each skill of `objectIds`, found by the same rules as every
 * painting (own-art S4): webp, then png, then jpg (or jpeg), names in any case. Any other file is ignored.
 */
export function walkerArtFrom(files: readonly ArtFile[], objectIds: readonly string[]): WalkerArt {
	const find = artFileFinder(files);
	const stages: Partial<Record<StageId, string>> = {};
	for (const stage of STAGE_IDS) {
		const url = find(`walker-${stage}`);
		if (url !== null) stages[stage] = url;
	}
	const objects: Record<string, string> = {};
	for (const id of objectIds) {
		const url = find(`object-${id}`);
		if (url !== null) objects[id] = url;
	}
	return { stages, objects };
}
