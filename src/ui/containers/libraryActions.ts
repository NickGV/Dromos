import type { CampaignSnapshot, LibraryState, LoadLibrary, ReadReflection, SyncCampaigns } from '../../application';
import type { ReflectionText } from '../../ports';

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

/**
 * "Enviar a Habitica" for a habit beside the desk (ADR-017): the habit `title` of the area at
 * `areaPath`. It reports its own outcome (a notice); whatever it answers, the room only reads again.
 */
export type HabitSend = (areaPath: string, title: string) => Promise<unknown>;

/**
 * Runs `send`, then re-reads the vault with no Habitica request (`reload` joins a sync already
 * running) and answers with the new snapshot, so a habit that got its id loses its button. A
 * rejected send is read again too: the note may have changed before it failed.
 */
export async function runHabitSend(send: HabitSend, areaPath: string, title: string, sync: Pick<SyncCampaigns, 'reload'>): Promise<CampaignSnapshot> {
	try {
		await send(areaPath, title);
	} catch {
		// The send says its own failure; the next read shows whatever the note holds.
	}
	return sync.reload();
}

/** Loads the text of the open card's reflection; see `reflectionLoader`. */
export interface ReflectionLoader {
	/** Reads the text of the book at `path`, dropping any read still on its way. */
	load(path: string): void;
	/** Drops any read still on its way, for a screen that closed. */
	stop(): void;
}

/**
 * Reads the text of a book's reflection for the card (M7 S5) and hands it to `deliver` with its
 * path, only when no later `load` or `stop` came meanwhile: a slow read of a card no longer open
 * never replaces the text of the one that is. A read that rejects hands over `null`, which keeps
 * the card's labels.
 */
export function reflectionLoader(read: Pick<ReadReflection, 'execute'>, deliver: (path: string, text: ReflectionText | null) => void): ReflectionLoader {
	let latest = 0;
	return {
		load: (path) => {
			const request = (latest += 1);
			const handOver = (text: ReflectionText | null): void => {
				if (request === latest) deliver(path, text);
			};
			void read.execute(path).then(handOver, () => handOver(null));
		},
		stop: () => {
			latest += 1;
		},
	};
}
