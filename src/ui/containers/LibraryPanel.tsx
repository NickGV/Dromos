import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { LibraryState, LoadLibrary } from '../../application';
import type { Language } from '../../i18n';
import type { Clock } from '../../ports';
import { useT } from '../i18n';
import { BookCard, type BookCardBusy } from '../organisms/BookCard';
import { LibraryRoom } from '../organisms/LibraryRoom';
import { LibraryShelf } from '../organisms/LibraryShelf';
import { ScreenHeader, type ScreenHeaderCharacter } from '../organisms/ScreenHeader';
import { bookCardView } from '../presenters/bookCardView';
import type { DayPeriod } from '../presenters/dayPeriod';
import { libraryRoomView, libraryShelfView } from '../presenters/libraryView';
import { runBookAction, type BookAction } from './libraryActions';

/** A card open over the workspace (an Obsidian `Modal`, built in `src/adapters`). */
export interface CardModal {
	/** Draws `content` in the open card, in place of what it showed. */
	show(content: ReactNode): void;
	close(): void;
}

/** What a card is opened with: its accessible name and language, what it draws, and what runs once it closes, however it closes. */
export interface CardModalOptions {
	readonly label: string;
	readonly lang: string;
	readonly content: ReactNode;
	readonly onClose: () => void;
}

/** What the library needs from the application layer; built in `src/composition`. */
export interface LibraryDeps {
	readonly loadLibrary: Pick<LoadLibrary, 'execute'>;
	/** Opens the book card over the workspace. */
	readonly openCard: (options: CardModalOptions) => CardModal;
	/** Opens a note in another tab. */
	readonly openNote: (path: string) => void;
	/** "Empezar a leer" (M7 S4); absent, the card shows no such button. */
	readonly startReading?: BookAction;
	/** "Terminar" (M7 S4); absent, the card shows no such button. */
	readonly finishReading?: BookAction;
	readonly clock: Clock;
}

export interface LibraryPanelProps {
	readonly deps: LibraryDeps;
	/** The character the header card names, or `null` while there is none. */
	readonly character: ScreenHeaderCharacter | null;
	/** The interface language, for the card, which opens outside the view. */
	readonly language: Language;
	/** The time of day: the desk's oil lamp is lit at night. */
	readonly period: DayPeriod;
}

/** Numbers the open libraries, so the ids of each one's described buttons are its own. */
let libraryCount = 0;

/**
 * Container of the library screen (M7 S5): reads the books when the screen opens, after a state
 * action and when a card closes (the note may have been written meanwhile); none of it touches the
 * network. It holds which level is on show: the room, or one shelf in its place with "←
 * Biblioteca" in the header card. A card opens through `deps.openCard` and is drawn again on every
 * render here, so it follows the books; a state action runs once at a time, and the books are read
 * again when it settles. "Abrir la nota" closes the card and opens the note in another tab.
 */
export function LibraryPanel({ deps, character, language, period }: LibraryPanelProps) {
	const t = useT();
	// `null` while the first read runs: saying the library is empty would be a guess.
	const [library, setLibrary] = useState<LibraryState | null>(null);
	const [shelf, setShelf] = useState<string | null>(null);
	const [cardPath, setCardPath] = useState<string | null>(null);
	const [busy, setBusy] = useState<BookCardBusy>(null);
	const [idPrefix] = useState(() => `dromos-library-${(libraryCount += 1)}`);
	const acting = useRef(false);
	const focusNote = useRef(false);
	const modal = useRef<CardModal | null>(null);
	const mounted = useRef(false);
	const body = useRef<HTMLDivElement>(null);
	const today = deps.clock.today();
	useShelfFocus(shelf, body);

	const reload = useCallback(async (): Promise<void> => {
		const next = await deps.loadLibrary.execute();
		if (mounted.current) setLibrary(next);
	}, [deps]);

	useEffect(() => {
		mounted.current = true;
		void reload();
		return () => {
			mounted.current = false;
			modal.current?.close();
		};
	}, [reload]);

	const act = (kind: 'start' | 'finish', path: string): void => {
		const action = kind === 'start' ? deps.startReading : deps.finishReading;
		if (!action || acting.current) return;
		acting.current = true;
		setBusy(kind);
		void runBookAction(action, path, deps.loadLibrary).then((next) => {
			acting.current = false;
			if (!mounted.current) return;
			// "Terminar" takes its own button away: the focus goes on to "Abrir la nota", the next step.
			focusNote.current = kind === 'finish';
			setLibrary(next);
			setBusy(null);
		});
	};

	const openNote = (path: string): void => {
		modal.current?.close();
		deps.openNote(path);
	};

	// The open card follows every render: the books, the busy button and the language.
	useEffect(() => {
		if (cardPath === null || library === null) return;
		const book = library.kind === 'loaded' ? library.books.find((candidate) => candidate.path === cardPath) : undefined;
		if (!book) {
			// The note is gone (renamed, deleted) since the card opened, or the books could not be read again.
			modal.current?.close();
			return;
		}
		const view = bookCardView(book, today, t, { start: deps.startReading !== undefined, finish: deps.finishReading !== undefined });
		const content = (
			<BookCard
				view={view}
				busy={busy}
				onStart={() => act('start', book.path)}
				onFinish={() => act('finish', book.path)}
				onOpenNote={() => openNote(book.path)}
				focusNote={focusNote.current}
				idPrefix={idPrefix}
			/>
		);
		focusNote.current = false;
		if (modal.current) {
			modal.current.show(content);
			return;
		}
		modal.current = deps.openCard({
			label: view.ariaLabel,
			lang: language,
			content,
			onClose: () => {
				modal.current = null;
				if (!mounted.current) return;
				setCardPath(null);
				void reload();
			},
		});
	});

	const shelfView = shelf !== null && library?.kind === 'loaded' ? libraryShelfView(library.books, shelf, today, t) : null;
	// A shelf whose last book left (archived, moved) is no place to be: back to the room.
	const shelfGone = shelf !== null && library?.kind === 'loaded' && shelfView === null;
	useEffect(() => {
		if (shelfGone) setShelf(null);
	}, [shelfGone]);
	const back =shelfView ? { label: shelfView.backLabel, ariaLabel: shelfView.backAria, onBack: () => setShelf(null) } : undefined;
	return (
		<>
			<ScreenHeader title={shelfView ? shelfView.title : t('screen.library')} character={character} back={back} />
			<div className="dromos-library" data-period={period} ref={body}>
				{library === null ? (
					<p className="dromos-library-note">{t('library.loading')}</p>
				) : library.kind === 'unreadable' ? (
					<p className="dromos-library-note is-error">{t('library.unreadable')}</p>
				) : shelfView ? (
					<LibraryShelf view={shelfView} onOpenCard={setCardPath} idPrefix={idPrefix} />
				) : (
					<LibraryRoom view={libraryRoomView(library.books, today, t)} onOpenShelf={setShelf} onOpenCard={setCardPath} idPrefix={idPrefix} />
				)}
			</div>
		</>
	);
}

/**
 * After the shelf on show changes (not on the first paint), scrolls the view back to the top and
 * moves the focus to the header card's title, which names the new level.
 */
function useShelfFocus(shelf: string | null, body: RefObject<HTMLElement>): void {
	const shown = useRef(shelf);
	useEffect(() => {
		if (shown.current === shelf) return;
		shown.current = shelf;
		const scroller = body.current?.closest<HTMLElement>('.dromos-root');
		if (scroller) scroller.scrollTop = 0;
		body.current?.parentElement?.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true });
	}, [shelf, body]);
}
