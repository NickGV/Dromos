import type { NoteMetadata } from './noteMetadata';

/** What the metadata cache holds for one note in these tests; `null` is a note not cached yet. */
export type FakeCache = (Partial<NoteMetadata> & { readonly frontmatter?: unknown }) | null;

/**
 * The slice of Obsidian's `App` a vault reader uses, without importing `obsidian`: one markdown
 * file per entry of `notes`, keyed by path. Cast it to the repository's constructor parameter.
 */
export function fakeVaultApp(notes: Readonly<Record<string, FakeCache>>) {
	const files = Object.keys(notes).map((path) => ({ path }));
	return {
		vault: { getMarkdownFiles: () => files },
		metadataCache: { getFileCache: (file: { path: string }) => notes[file.path] ?? null },
	};
}
