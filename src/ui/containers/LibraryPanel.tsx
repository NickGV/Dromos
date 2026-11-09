import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { CampaignSnapshot, LibraryState, LoadLibrary, ReadReflection, SyncCampaigns } from '../../application';
import type { Language } from '../../i18n';
import type { Clock, ReflectionText } from '../../ports';
import type { MarkdownRender } from '../atoms/MarkdownBlock';
import { useT } from '../i18n';
import { BookCard, type BookCardBusy } from '../organisms/BookCard';
import { LibraryRoom, type SendingHabit } from '../organisms/LibraryRoom';
import { LibraryShelf } from '../organisms/LibraryShelf';
import { ScreenHeader, type ScreenHeaderCharacter } from '../organisms/ScreenHeader';
import { bookCardView } from '../presenters/bookCardView';
import type { DayPeriod } from '../presenters/dayPeriod';
import { libraryHabitsView, libraryRoomView, libraryShelfView } from '../presenters/libraryView';
import { reflectionLoader, runBookAction, runHabitSend, type BookAction, type HabitSend } from './libraryActions';

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

/**
 * The areas' reading habits beside the desk (ADR-017). Their streaks come from the campaigns'
 * sync, so the library reads its snapshot and spends no Habitica request of its own.
 */
export interface LibraryHabitsDeps {
	/** The session's campaigns and areas right now. */
	readonly snapshot: () => CampaignSnapshot;
	/**
	 * `execute` joins the sync the campaigns panel starts for the same `syncKey`, so it makes no
	 * request of its own; `reload` re-reads the vault with no request, after a send.
	 */
	readonly sync: Pick<SyncCampaigns, 'execute' | 'reload'>;
	/** "Enviar a Habitica" for a habit; it reports its own outcome (a notice). */
	readonly send: HabitSend;
}

/** What the library needs from the application layer; built in `src/composition`. */
export interface LibraryDeps {
	readonly loadLibrary: Pick<LoadLibrary, 'execute'>;
	/** Reads what was written in each part of a book's reflection, for the card; never rejects. */
	readonly readReflection: Pick<ReadReflection, 'execute'>;
	/** Draws that text in the card as Obsidian renders the note. */
	readonly renderMarkdown: MarkdownRender;
	/** Opens the book card over the workspace. */
	readonly openCard: (options: CardModalOptions) => CardModal;
	/** Opens a note in another tab. */
	readonly openNote: (path: string) => void;
	/** "Empezar a leer" (M7 S4); absent, the card shows no such button. */
	readonly startReading?: BookAction;
	/** "Terminar" (M7 S4); absent, the card shows no such button. */
	readonly finishReading?: BookAction;
	/** The habits beside the desk (ADR-017). */
	readonly habits: LibraryHabitsDeps;
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
	/** The home's sync counter: each bump the campaigns panel syncs, and the habits follow that sync. */
	readonly syncKey: number;
}

/** Numbers the open libraries, so the ids of each one's described buttons are its own. */
let libraryCount = 0;

/**
 * Container of the library screen (M7 S5): reads the books when the screen opens, after a state
 * action and when a card closes (the note may have been written meanwhile); none of it touches the
 * network. It holds which level is on show: the room, or one shelf in its place with "←
 * Biblioteca" in the header card. A card opens through `deps.openCard` and is drawn again on every
 * render here, so it follows the books; a state action runs once at a time, and the books are read
 * again when it settles. The text of the reflection is read each time a card opens and after each
 * state action, and the card is drawn again when it arrives; until then its written parts say
 * "Escrita". "Abrir la nota", or a link followed in that text, closes the card and opens the note.
 *
 * The habits beside the desk (ADR-017) are read from the campaigns' snapshot when the screen opens,
 * with no request; a sync still running then is joined. Each bump of `syncKey` after that joins the
 * sync the campaigns panel starts for it. "Enviar a Habitica" runs once at a time, reports its
 * outcome itself, then the vault is read again, so the sent habit loses its button.
 */
export function LibraryPanel({ deps, character, language, period, syncKey }: LibraryPanelProps) {
	const t = useT();
	// `null` while the first read runs: saying the library is empty would be a guess.
	const [library, setLibrary] = useState<LibraryState | null>(null);
	const [shelf, setShelf] = useState<string | null>(null);
	const [cardPath, setCardPath] = useState<string | null>(null);
	const [busy, setBusy] = useState<BookCardBusy>(null);
	// The text of the open card's reflection, with the path it was read for; `null` while none is read.
	const [reflection, setReflection] = useState<{ readonly path: string; readonly text: ReflectionText | null } | null>(null);
	const [idPrefix] = useState(() => `dromos-library-${(libraryCount += 1)}`);
	const [habits, setHabits] = useState<CampaignSnapshot>(deps.habits.snapshot);
	const [sendingHabit, setSendingHabit] = useState<SendingHabit | null>(null);
	const acting = useRef(false);
	const sendingRef = useRef(false);
	const seenSyncKey = useRef(syncKey);
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

	const reflections = useMemo(() => reflectionLoader(deps.readReflection, (path, text) => setReflection({ path, text })), [deps.readReflection]);
	useEffect(() => () => reflections.stop(), [reflections]);

	// Every open reads the note again: the reflection may have been written since the card last closed.
	const openCard = (path: string): void => {
		setReflection(null);
		setCardPath(path);
		reflections.load(path);
	};

	useEffect(() => {
		mounted.current = true;
		void reload();
		return () => {
			mounted.current = false;
			modal.current?.close();
		};
	}, [reload]);

	// A sync still running as the screen opens is joined, with no request, so the streaks it brings show.
	useEffect(() => {
		if (deps.habits.snapshot().status.kind !== 'syncing') return;
		void deps.habits.sync.reload().then((next) => {
			if (mounted.current) setHabits(next);
		});
	}, [deps]);

	// Each later bump joins the sync the campaigns panel starts for it: one request for both screens.
	useEffect(() => {
		if (seenSyncKey.current === syncKey) return;
		seenSyncKey.current = syncKey;
		void deps.habits.sync.execute().then((next) => {
			if (mounted.current) setHabits(next);
		});
	}, [deps, syncKey]);

	const sendHabit = (areaPath: string, title: string): void => {
		if (sendingRef.current) return;
		sendingRef.current = true;
		setSendingHabit({ areaPath, title });
		// "Enviando…" stays until the vault is read again, so the button never flashes back.
		void runHabitSend(deps.habits.send, areaPath, title, deps.habits.sync).then((next) => {
			sendingRef.current = false;
			if (!mounted.current) return;
			setHabits(next);
			setSendingHabit(null);
		});
	};

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
			// The text shown stays until the new read arrives, so the card does not flicker.
			reflections.load(path);
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
		const text = reflection !== null && reflection.path === book.path ? reflection.text : null;
		const view = bookCardView(book, today, t, { start: deps.startReading !== undefined, finish: deps.finishReading !== undefined }, text);
		const content = (
			<BookCard
				view={view}
				busy={busy}
				onStart={() => act('start', book.path)}
				onFinish={() => act('finish', book.path)}
				onOpenNote={() => openNote(book.path)}
				renderMarkdown={deps.renderMarkdown}
				onFollowLink={() => modal.current?.close()}
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
					<LibraryShelf view={shelfView} onOpenCard={openCard} idPrefix={idPrefix} />
				) : (
					<LibraryRoom
						view={libraryRoomView(library.books, today, t)}
						onOpenShelf={setShelf}
						onOpenCard={openCard}
						idPrefix={idPrefix}
						habits={libraryHabitsView(habits, t)}
						sendingHabit={sendingHabit}
						onSendHabit={sendHabit}
					/>
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
