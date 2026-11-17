import type { App } from 'obsidian';
import type { AppNotes } from '../../domain';
import type { AppNoteRepository } from '../../ports';
import { buildAppNotes, CHESHBON_NOTE_TYPE, KAIROS_DAY_TYPE, type AppNote } from './appNoteMapper';
import { asRecord } from './frontmatterFields';

/**
 * The notes Kairos and Cheshbon write (Dromos ADR-022), read from the vault with `metadataCache`, by
 * `type` alone: no folder and no file name decides what is read, so an untyped note in `Kairos/` is
 * never read (app-reports S3). It reads the cached frontmatter only, never the body, and it has no
 * way to write: it holds no `fileManager` and calls nothing of the vault but its list of files.
 * Notes without a cache entry yet (right after Obsidian starts) are skipped; the next read sees them.
 */
export class VaultAppNoteRepository implements AppNoteRepository {
	constructor(private readonly app: Pick<App, 'vault' | 'metadataCache'>) {}

	read(): Promise<AppNotes> {
		return Promise.resolve(buildAppNotes(this.notes()));
	}

	private notes(): AppNote[] {
		return this.app.vault.getMarkdownFiles().flatMap((file) => {
			const frontmatter: unknown = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const type = asRecord(frontmatter).type;
			return type === KAIROS_DAY_TYPE || type === CHESHBON_NOTE_TYPE ? [{ path: file.path, frontmatter }] : [];
		});
	}
}
