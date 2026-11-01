import { normalizePath, type App } from 'obsidian';
import type { LedgerRow } from '../../domain';
import type { LedgerLoadResult, LedgerRepository, UnreadableLedgerEvent } from '../../ports';
import { ledgerFolderPath, ledgerNotePath } from './folderPath';
import { appendLedgerRows, newLedgerNote, parseLedgerNote, rowsByMonth } from './ledgerNote';

const MONTH_NOTE = /^\d{4}-\d{2}\.md$/;

/**
 * The ledger notes of `Dromos/Ledger/`, one per month. It only adds rows: `vault.process`
 * reads and writes a note in one step, so rows already there are never lost, and appends
 * run one after another so two syncs cannot create the same month twice.
 */
export class VaultLedgerRepository implements LedgerRepository {
	private queue: Promise<void> = Promise.resolve();

	constructor(
		private readonly app: Pick<App, 'vault'>,
		private readonly vaultFolder: () => string,
		/** Local date as `YYYY-MM-DD`, for the `created` field of a new month. */
		private readonly today: () => string,
	) {}

	async readAll(): Promise<LedgerLoadResult> {
		const folder = normalizePath(ledgerFolderPath(this.vaultFolder()));
		const files = this.app.vault
			.getMarkdownFiles()
			.filter((file) => file.parent?.path === folder && MONTH_NOTE.test(file.name))
			.sort((left, right) => left.name.localeCompare(right.name));

		const rows: LedgerRow[] = [];
		const unreadable: UnreadableLedgerEvent[] = [];
		for (const file of files) {
			const parsed = parseLedgerNote(await this.app.vault.cachedRead(file));
			rows.push(...parsed.rows);
			unreadable.push(...parsed.unreadable.map((line) => ({ path: file.path, ...line })));
		}
		return { rows, unreadable };
	}

	append(rows: readonly LedgerRow[]): Promise<void> {
		const run = this.queue.then(() => this.appendNow(rows));
		this.queue = run.catch(() => undefined);
		return run;
	}

	private async appendNow(rows: readonly LedgerRow[]): Promise<void> {
		for (const [month, monthRows] of rowsByMonth(rows)) {
			const path = normalizePath(ledgerNotePath(this.vaultFolder(), month));
			const file = this.app.vault.getFileByPath(path);
			if (file) {
				await this.app.vault.process(file, (text) => appendLedgerRows(text, monthRows));
				continue;
			}
			const folder = normalizePath(ledgerFolderPath(this.vaultFolder()));
			if (!this.app.vault.getFolderByPath(folder)) await this.app.vault.createFolder(folder);
			await this.app.vault.create(path, appendLedgerRows(newLedgerNote(month, this.today()), monthRows));
		}
	}
}
