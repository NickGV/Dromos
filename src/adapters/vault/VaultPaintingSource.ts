import { TFile, type App } from 'obsidian';
import type { Painting, PaintingSource } from '../../ports';

/** The art folder under the Dromos folder (own-art S4), to pass to `notePathIn`: `Dromos/Arte`. */
export const artFolderPath = (folder: string): string => `${folder}/Arte`;

/**
 * The paintings in `<Dromos folder>/Arte/` (own-art S1), served by Obsidian's public
 * `Vault.getResourcePath`, so they sync with the vault on every device and are never bundled with
 * the plugin. Lists the folder's files only, not its subfolders; a missing folder lists nothing.
 */
export class VaultPaintingSource implements PaintingSource {
	constructor(
		private readonly app: App,
		/** The art folder's vault path, normalized, for example `Dromos/Arte`. */
		private readonly folderPath: () => string,
	) {}

	list(): readonly Painting[] {
		const folder = this.app.vault.getFolderByPath(this.folderPath());
		if (!folder) return [];
		return folder.children.filter((child): child is TFile => child instanceof TFile).map((file) => ({ name: file.name, url: this.app.vault.getResourcePath(file) }));
	}
}
