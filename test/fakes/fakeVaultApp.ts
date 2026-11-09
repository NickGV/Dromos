import type { NoteMetadata } from './noteMetadata';

/** What the metadata cache holds for one note in these tests; `null` is a note not cached yet. */
export type FakeCache = (Partial<NoteMetadata> & { readonly frontmatter?: unknown }) | null;

type FakeFile = { readonly path: string };

export interface FakeVaultOptions {
	/** The text of each note below its frontmatter, by path. Nothing in the fake can write it. */
	readonly bodies?: Readonly<Record<string, string>>;
	/**
	 * False keeps the cache's old frontmatter after a write until `refreshCache` is called, as
	 * Obsidian does for a moment after saving. Default true: the cache follows every write.
	 */
	readonly cacheFollowsWrites?: boolean;
	/** `processFrontMatter` rejects with it, as a save that fails does. */
	readonly failWritesWith?: Error;
}

/**
 * The slice of Obsidian's `App` a vault repository uses, without importing `obsidian`: one markdown
 * file per entry of `notes`, keyed by path. Each note's saved frontmatter starts as its cached one;
 * `fileManager.processFrontMatter` changes the saved copy and, by default, the cache too, firing
 * the cache's "changed" event. Cast it to the repository's constructor parameter.
 */
export function fakeVaultApp(notes: Readonly<Record<string, FakeCache>>, options: FakeVaultOptions = {}) {
	const files: FakeFile[] = Object.keys(notes).map((path) => ({ path }));
	const caches = new Map<string, FakeCache>(Object.entries(notes));
	const saved = new Map(Object.entries(notes).map(([path, cache]) => [path, savedCopy(cache?.frontmatter)]));
	const bodies = new Map(Object.entries(options.bodies ?? {}));
	const listeners = new Set<(file: FakeFile) => void>();

	/** Makes the cache read the saved frontmatter again and fires "changed" for the note. */
	const refreshCache = (path: string): void => {
		caches.set(path, { ...caches.get(path), frontmatter: structuredClone(saved.get(path)) });
		const file = files.find((candidate) => candidate.path === path);
		if (file) for (const listener of [...listeners]) listener(file);
	};

	return {
		vault: {
			getMarkdownFiles: () => files,
			getFileByPath: (path: string) => files.find((file) => file.path === path) ?? null,
		},
		metadataCache: {
			getFileCache: (file: FakeFile) => caches.get(file.path) ?? null,
			on: (_name: 'changed', listener: (file: FakeFile) => void) => {
				listeners.add(listener);
				return listener;
			},
			offref: (ref: unknown) => void listeners.delete(ref as (file: FakeFile) => void),
		},
		fileManager: {
			processFrontMatter: (file: FakeFile, apply: (frontmatter: Record<string, unknown>) => void): Promise<void> => {
				if (options.failWritesWith) return Promise.reject(options.failWritesWith);
				const frontmatter = structuredClone(saved.get(file.path) ?? {});
				apply(frontmatter);
				saved.set(file.path, frontmatter);
				if (options.cacheFollowsWrites ?? true) refreshCache(file.path);
				return Promise.resolve();
			},
		},
		/** The frontmatter saved in the note, as `processFrontMatter` left it. */
		savedFrontmatter: (path: string) => saved.get(path),
		/** The note's text below its frontmatter. */
		bodyOf: (path: string) => bodies.get(path),
		refreshCache,
		/** How many "changed" listeners are still registered. */
		listenerCount: () => listeners.size,
	};
}

function savedCopy(frontmatter: unknown): Record<string, unknown> {
	return typeof frontmatter === 'object' && frontmatter !== null ? structuredClone(frontmatter as Record<string, unknown>) : {};
}
