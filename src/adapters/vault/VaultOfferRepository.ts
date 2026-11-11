import type { App } from 'obsidian';
import type { OfferLoadResult, OfferRepository } from '../../ports';
import { parseShopNote } from './shopNote';

/**
 * Esdras's offers, `<Dromos folder>/Shop.md` (M10 S2, ADR-019): read by its path whatever its
 * `type` says, each time the Shop is read. Only Esdras writes it; Dromos never does, and hides an
 * offer once it is bought or past its last day.
 */
export class VaultOfferRepository implements OfferRepository {
	constructor(
		private readonly app: Pick<App, 'vault'>,
		/** The note's vault path, normalized, for example `Dromos/Shop.md`. */
		private readonly notePath: () => string,
	) {}

	async load(): Promise<OfferLoadResult> {
		const path = this.notePath();
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { offers: [], unreadable: [] };
		const { offers, unreadable } = parseShopNote(await this.app.vault.cachedRead(file));
		return { offers, unreadable: unreadable.map((line) => ({ path, ...line })) };
	}
}
