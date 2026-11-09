import type { LibraryState, LoadLibrary } from '../../application';

/**
 * A state action of the book card, "Empezar a leer" or "Terminar" (M7 S4), on the book at `path`.
 * It reports its own failures (a toast); whatever it answers, the card only reads the books again.
 */
export type BookAction = (path: string) => Promise<unknown>;

/**
 * Runs `action` on the book at `path`, then reads the books again and answers with them, so the
 * room, the shelf and the open card show the state the note now holds. A rejected action is read
 * again too: the note may have changed before it failed, and the screen shows what is true.
 */
export async function runBookAction(action: BookAction, path: string, load: Pick<LoadLibrary, 'execute'>): Promise<LibraryState> {
	try {
		await action(path);
	} catch {
		// The action says its own failure; the next read shows whatever the note holds.
	}
	return load.execute();
}
