import type { App } from 'obsidian';
import type { PurseEntry } from '../../domain';
import type { PurseLoadResult, PurseRepository } from '../../ports';
import { appendPurseEntries, newPurseNote, parsePurseNote } from './purseNote';

/**
 * The purse, `<Dromos folder>/Purse.md` (M10 S3, ADR-019). It is read from disk, not from the cache,
 * since a bonus is paid only when the purse holds no row for its level. It only adds rows:
 * `vault.process` reads and writes the note in one step, so rows already there are never lost,
 * and appends run one after another so two at once cannot create the note twice.
 */
export class VaultPurseRepository implements PurseRepository {
	private queue: Promise<void> = Promise.resolve();

	constructor(
		private readonly app: Pick<App, 'vault'>,
		/** The note's vault path, normalized, for example `Dromos/Purse.md`. */
		private readonly notePath: () => string,
		/** Local date as `YYYY-MM-DD`, for the `created` field of a new purse. */
		private readonly today: () => string,
	) {}

	async read(): Promise<PurseLoadResult> {
		const path = this.notePath();
		const file = this.app.vault.getFileByPath(path);
		if (!file) return { entries: [], unreadable: [] };
		const { entries, unreadable } = parsePurseNote(await this.app.vault.read(file));
		return { entries, unreadable: unreadable.map((line) => ({ path, ...line })) };
	}

	append(entries: readonly PurseEntry[]): Promise<void> {
		const run = this.queue.then(() => this.appendNow(entries));
		this.queue = run.catch(() => undefined);
		return run;
	}

	private async appendNow(entries: readonly PurseEntry[]): Promise<void> {
		if (entries.length === 0) return;
		const path = this.notePath();
		const file = this.app.vault.getFileByPath(path);
		if (file) {
			await this.app.vault.process(file, (text) => appendPurseEntries(text, entries));
			return;
		}
		const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
		if (folder !== '' && !this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
		await this.app.vault.create(path, appendPurseEntries(newPurseNote(this.today()), entries));
	}
}
