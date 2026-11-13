import type { CampaignSnapshot, LibraryState } from '../../application';
import { bookState, compareBooks, daysSince, groupByShelf, isReadingHabit, type Book, type BookState, type Shelf } from '../../domain';
import { plural, type MessageKey, type Translator } from '../../i18n';
import { goneByTitle, habitRow, type HabitRowView } from './campaignView';

/** Every state the library shows: an archived book is not shown anywhere (M7 S5). */
export type ShownBookState = Exclude<BookState, 'archived'>;

/** The tied scrolls an alcove draws at most, as a hint of what it holds. */
export const ALCOVE_SCROLLS = 6;

/** The reading room, level 1 of the library (M7 S5): the wall of alcoves behind, the desk in front. */
export interface LibraryRoomView {
	/** "2 leyendo · 4 pendientes · 3 terminados", "· 1 en pausa" added when any is; `null` for an empty library. */
	readonly summary: string | null;
	/** The empty library's line; `null` while it holds a book. */
	readonly empty: string | null;
	readonly shelvesTitle: string;
	/** One per shelf, in `groupByShelf` order: alphabetical, the books with no shelf last. */
	readonly alcoves: readonly AlcoveView[];
	readonly desk: DeskView;
}

/** One alcove of the wall: the whole alcove is one button that opens its shelf. */
export interface AlcoveView {
	/** What `libraryShelfView` takes to find the shelf again after the books are read anew. */
	readonly id: string;
	readonly name: string;
	/** "3 libros": its own line under the name, so a long name never breaks around the count. */
	readonly countText: string;
	readonly openLabel: string;
	/** How many tied scrolls to draw, 1 to `ALCOVE_SCROLLS`. */
	readonly scrolls: number;
	/** The books with no shelf stand in a capsa, the round scroll box, not in a niche. */
	readonly capsa: boolean;
}

/** The reading desk, "Leyendo ahora": the books being read, paused ones stay on their shelf. */
export interface DeskView {
	readonly title: string;
	readonly scrolls: readonly DeskScrollView[];
	/** The bare desk's line; `null` while a book is on it, and in an empty library, which says so itself. */
	readonly empty: string | null;
}

export interface DeskScrollView {
	readonly path: string;
	readonly title: string;
	readonly author: string | null;
	/** "Leyendo desde hace 12 días", or "Leyendo" with no start date. */
	readonly since: string;
	readonly openLabel: string;
}

/** The habits beside the desk (ADR-017): the areas' reading habits, rowed as a campaign's. */
export interface LibraryHabitsView {
	/** "Diarias" (ADR-021). */
	readonly title: string;
	readonly rows: readonly LibraryHabitRowView[];
}

export interface LibraryHabitRowView {
	/** The `archeion` note the habit is declared in, which "Enviar a Habitica" writes. */
	readonly areaPath: string;
	readonly row: HabitRowView;
}

/** One shelf, level 2 of the library (M7 S5), shown in place of the room. */
export interface LibraryShelfView {
	readonly id: string;
	/** "Teología · 3". */
	readonly title: string;
	/** The visible back link, "Biblioteca", and its accessible name. */
	readonly backLabel: string;
	readonly backAria: string;
	/** Reading (paused books too), pending and finished, in that order; a row with no book is left out. */
	readonly rows: readonly ShelfRowView[];
}

export interface ShelfRowView {
	readonly id: 'reading' | 'pending' | 'finished';
	/** "Leyendo · 2". */
	readonly title: string;
	readonly scrolls: readonly ShelfScrollView[];
}

/** One scroll on a shelf: a button that opens its card, with its hanging tag and its state in words. */
export interface ShelfScrollView {
	readonly path: string;
	readonly title: string;
	readonly author: string | null;
	readonly state: ShownBookState;
	readonly stateLabel: string;
	/** "En la mesa de lectura" for a book being read, else `null`. */
	readonly note: string | null;
	readonly openLabel: string;
}

const STATE_LABELS: Readonly<Record<ShownBookState, MessageKey>> = {
	pending: 'library.state.pending',
	reading: 'library.state.reading',
	paused: 'library.state.paused',
	sealed: 'library.state.sealed',
	'reflection-missing': 'library.state.reflectionMissing',
};

/** The rows of a shelf and the states each holds, in the order they are drawn. */
const ROWS: readonly { readonly id: ShelfRowView['id']; readonly title: MessageKey; readonly states: readonly ShownBookState[] }[] = [
	{ id: 'reading', title: 'library.row.reading', states: ['reading', 'paused'] },
	{ id: 'pending', title: 'library.row.pending', states: ['pending'] },
	{ id: 'finished', title: 'library.row.finished', states: ['sealed', 'reflection-missing'] },
];

/** A book with the state the library shows for it. */
interface ShownBook {
	readonly book: Book;
	readonly state: ShownBookState;
}

/** The books the library shows: every one but the archived (M7 S5). */
export function shownBooks(books: readonly Book[]): ShownBook[] {
	return books.flatMap((book) => {
		const state = bookState(book);
		return state === 'archived' ? [] : [{ book, state }];
	});
}

export function stateLabel(state: ShownBookState, t: Translator): string {
	return t(STATE_LABELS[state]);
}

/** The shelf as the screen names it: as written in the notes, or "Sin estante". */
export function shelfName(name: string | null, t: Translator): string {
	return name ?? t('library.noShelf');
}

/**
 * The key that finds a shelf again after the books are read anew: the same match `groupByShelf`
 * makes (case-insensitive, NFC), so "teología" in one note and "Teología" in another are one shelf.
 * The books with no shelf have the empty key.
 */
export function shelfId(name: string | null): string {
	return name === null ? '' : name.normalize('NFC').toLowerCase();
}

/**
 * How long a book has been read, from its `started` date and today: "Leyendo desde hace 12 días",
 * "desde hace 1 día", "desde hoy" (a start in the future reads as today), or "Leyendo" alone
 * without a start date.
 */
export function readingSince(started: string | null, today: string, t: Translator): string {
	const days = started !== null && /^\d{4}-\d{2}-\d{2}$/.test(started) ? daysSince(started, today) : Number.NaN;
	if (!Number.isFinite(days)) return t('library.state.reading');
	if (days <= 0) return t('library.since.today');
	return plural(t, 'library.since', days);
}

/** The reading room (M7 S5): the summary, one alcove per shelf and the desk with the books being read. */
export function libraryRoomView(books: readonly Book[], today: string, t: Translator): LibraryRoomView {
	const shown = shownBooks(books);
	const shelvesTitle = t('library.shelves');
	if (shown.length === 0) return { summary: null, empty: t('library.empty'), shelvesTitle, alcoves: [], desk: { title: t('library.desk'), scrolls: [], empty: null } };

	const scrolls = deskScrolls(shown, today, t);
	return {
		summary: summaryText(shown, t),
		empty: null,
		shelvesTitle,
		alcoves: shelvesOf(shown).map((shelf) => alcoveView(shelf, t)),
		desk: { title: t('library.desk'), scrolls, empty: scrolls.length === 0 ? t('library.desk.empty') : null },
	};
}

/**
 * The small reading desk on home (home-header S1): the books being read, as the library's desk
 * draws them. `null` while the library is read, when it cannot be read, and while no book is
 * being read, so home draws no desk.
 */
export function homeDeskView(library: LibraryState | null, today: string, t: Translator): DeskView | null {
	if (library?.kind !== 'loaded') return null;
	const scrolls = deskScrolls(shownBooks(library.books), today, t);
	return scrolls.length === 0 ? null : { title: t('library.desk'), scrolls, empty: null };
}

/** The books being read, by title, each as a scroll on the desk. */
function deskScrolls(shown: readonly ShownBook[], today: string, t: Translator): DeskScrollView[] {
	const reading = shown.filter(({ state }) => state === 'reading').map(({ book }) => book);
	return [...reading].sort(compareBooks).map((book) => ({ path: book.path, title: book.title, author: book.author, since: readingSince(book.started, today, t), openLabel: t('library.openCard', { title: book.title }) }));
}

/**
 * The habits beside the desk (ADR-017): every habit of an area whose skills, its own or else its
 * area's, include `lector`, in the order of the areas (by title) and of their notes, with its
 * streak as the campaigns' sync left it, its days and its checklist count (ADR-021). A daily Habitica
 * confirmed deleted can be sent again; one whose id is no Habitica id reads as missing; none can be
 * sent while Habitica is not configured. `null` when there is none, so the room draws no block.
 */
export function libraryHabitsView(snapshot: CampaignSnapshot, t: Translator): LibraryHabitsView | null {
	const canSend = snapshot.status.kind !== 'not-configured';
	const rows = (snapshot.areas ?? []).flatMap((area) => {
		const gone = goneByTitle(snapshot.issues, area.path);
		return area.habits.filter((habit) => isReadingHabit(habit, area)).map((habit) => ({ areaPath: area.path, row: habitRow(habit, gone.get(habit.title) ?? null, { canSend, t }) }));
	});
	return rows.length === 0 ? null : { title: t('library.habits'), rows };
}

/** The shelf `id` (from `shelfId`), or `null` when no shown book is on it any more. */
export function libraryShelfView(books: readonly Book[], id: string, today: string, t: Translator): LibraryShelfView | null {
	const shelf = shelvesOf(shownBooks(books)).find((candidate) => shelfId(candidate.name) === id);
	if (!shelf) return null;
	const states = new Map(shownBooks(shelf.books).map(({ book, state }) => [book.path, state]));
	const rows = ROWS.flatMap((row): ShelfRowView[] => {
		// The row's states in their order, each in the shelf's own order: reading before paused.
		const scrolls = row.states.flatMap((state) => shelf.books.filter((book) => states.get(book.path) === state).map((book) => shelfScrollView(book, state, t)));
		return scrolls.length === 0 ? [] : [{ id: row.id, title: t('library.counted', { name: t(row.title), count: scrolls.length }), scrolls }];
	});
	return {
		id,
		title: t('library.counted', { name: shelfName(shelf.name, t), count: shelf.count }),
		backLabel: t('library.back'),
		backAria: t('library.back.aria'),
		rows,
	};
}

function summaryText(shown: readonly ShownBook[], t: Translator): string {
	const count = (...states: ShownBookState[]): number => shown.filter(({ state }) => states.includes(state)).length;
	const paused = count('paused');
	return [
		t('library.summary.reading', { count: count('reading') }),
		plural(t, 'library.summary.pending', count('pending')),
		plural(t, 'library.summary.finished', count('sealed', 'reflection-missing')),
		paused > 0 ? t('library.summary.paused', { count: paused }) : null,
	]
		.filter((part): part is string => part !== null)
		.join(' · ');
}

function shelvesOf(shown: readonly ShownBook[]): Shelf[] {
	return groupByShelf(shown.map(({ book }) => book));
}

function alcoveView(shelf: Shelf, t: Translator): AlcoveView {
	const name = shelfName(shelf.name, t);
	const books = plural(t, 'library.books', shelf.count);
	return {
		id: shelfId(shelf.name),
		name,
		countText: books,
		openLabel: t('library.openShelf', { name, books }),
		scrolls: Math.min(shelf.count, ALCOVE_SCROLLS),
		capsa: shelf.name === null,
	};
}

function shelfScrollView(book: Book, state: ShownBookState, t: Translator): ShelfScrollView {
	return {
		path: book.path,
		title: book.title,
		author: book.author,
		state,
		stateLabel: stateLabel(state, t),
		note: state === 'reading' ? t('library.onDesk') : null,
		openLabel: t('library.openCard', { title: book.title }),
	};
}
