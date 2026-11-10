import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { CampaignSnapshot, LibraryState, LoadLibrary, ReadReflection, ReadTakeaway, SyncCampaigns } from '../../application';
import type { Language } from '../../i18n';
import type { Clock, ReflectionText } from '../../ports';
import type { MarkdownRender } from '../atoms/MarkdownBlock';
import { useT } from '../i18n';
import { ArchiveRoom } from '../organisms/ArchiveRoom';
import { BookCard, type BookCardBusy } from '../organisms/BookCard';
import { LibraryRoom, type SendingHabit } from '../organisms/LibraryRoom';
import { LibraryShelf } from '../organisms/LibraryShelf';
import { ResourceCard } from '../organisms/ResourceCard';
import { ScreenHeader, type ScreenHeaderCharacter } from '../organisms/ScreenHeader';
import { archiveDoorView, archiveView, type ArchiveFilter } from '../presenters/archiveView';
import { bookCardView } from '../presenters/bookCardView';
import type { DayPeriod } from '../presenters/dayPeriod';
import { libraryHabitsView, libraryRoomView, libraryShelfView } from '../presenters/libraryView';
import { resourceCardView } from '../presenters/resourceCardView';
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
	/** Reads what was written under "Lo que me dejó" in a resource, for its card (M8 S6); never rejects. */
	readonly readTakeaway: Pick<ReadTakeaway, 'execute'>;
	/** "Marcar como leído" (visto, escuchado) on a resource (M8 S6); absent, its card shows no such button. */
	readonly markResourceFinished?: BookAction;
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

/** The card open over the workspace: a book's or a resource's, by the path of its note. */
interface OpenCard {
	readonly kind: 'book' | 'resource';
	readonly path: string;
}

/** The state action under way: a book's "Empezar a leer" or "Terminar", or a resource's "Marcar como leído". */
type LibraryBusy = BookCardBusy | 'mark';

/**
 * Container of the library screen (M7 S5, M8 S2): reads the books and the archive's resources when
 * the screen opens, after a state action and when a card closes (the note may have been written
 * meanwhile); none of it touches the network. It holds which level is on show: the room, one shelf
 * in its place, or the archive (with its pigeonhole and whether its processed ones are unfolded),
 * each but the room with "← Biblioteca" in the header card. A card, a book's or a resource's, opens
 * through `deps.openCard` and is drawn again on every render here, so it follows the notes; a
 * state action runs once at a time, and the notes are read again when it settles. The text of a
 * book's reflection, or of what a resource left, is read each time its card opens and after each
 * state action, and the card is drawn again when it arrives; until then the card says "Escrita"
 * ("Escrito"). "Abrir la nota", or a link followed in that text, closes the card and opens the note.
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
	// The archive (M8 S2) is on show in place of the room, with its pigeonhole and its unfolded processed ones.
	const [inArchive, setInArchive] = useState(false);
	const [pigeonhole, setPigeonhole] = useState<ArchiveFilter>('all');
	const [processedOpen, setProcessedOpen] = useState(false);
	const [card, setCard] = useState<OpenCard | null>(null);
	const [busy, setBusy] = useState<LibraryBusy>(null);
	// The text of the open card's reflection, with the path it was read for; `null` while none is read.
	const [reflection, setReflection] = useState<{ readonly path: string; readonly text: ReflectionText | null } | null>(null);
	// The same for what a resource left (M8 S6).
	const [takeaway, setTakeaway] = useState<{ readonly path: string; readonly text: string | null } | null>(null);
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
	useLevelFocus(inArchive ? 'archive' : shelf === null ? null : `shelf:${shelf}`, body);

	const reload = useCallback(async (): Promise<void> => {
		const next = await deps.loadLibrary.execute();
		if (mounted.current) setLibrary(next);
	}, [deps]);

	const reflections = useMemo(() => reflectionLoader(deps.readReflection, (path, text) => setReflection({ path, text })), [deps.readReflection]);
	useEffect(() => () => reflections.stop(), [reflections]);
	const takeaways = useMemo(() => reflectionLoader<string>(deps.readTakeaway, (path, text) => setTakeaway({ path, text })), [deps.readTakeaway]);
	useEffect(() => () => takeaways.stop(), [takeaways]);

	// Every open reads the note again: the reflection may have been written since the card last closed.
	const openCard = (path: string): void => {
		setReflection(null);
		setCard({ kind: 'book', path });
		reflections.load(path);
	};

	// The same for a resource: what it left may have been written since its card last closed.
	const openResourceCard = (path: string): void => {
		setTakeaway(null);
		setCard({ kind: 'resource', path });
		takeaways.load(path);
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

	const act = (kind: 'start' | 'finish' | 'mark', path: string): void => {
		const action = kind === 'start' ? deps.startReading : kind === 'finish' ? deps.finishReading : deps.markResourceFinished;
		if (!action || acting.current) return;
		acting.current = true;
		setBusy(kind);
		void runBookAction(action, path, deps.loadLibrary).then((next) => {
			acting.current = false;
			if (!mounted.current) return;
			// "Terminar" and "Marcar como leído" take their own button away: the focus goes on to "Abrir la nota", the next step.
			focusNote.current = kind !== 'start';
			setLibrary(next);
			setBusy(null);
			// The text shown stays until the new read arrives, so the card does not flicker.
			if (kind === 'mark') takeaways.load(path);
			else reflections.load(path);
		});
	};

	const openNote = (path: string): void => {
		modal.current?.close();
		deps.openNote(path);
	};

	/** What the open card draws now, with its accessible name; `null` once its note is gone. */
	const cardContent = (open: OpenCard, loaded: Extract<LibraryState, { kind: 'loaded' }>): { readonly label: string; readonly content: ReactNode } | null => {
		if (open.kind === 'resource') {
			const resource = loaded.resources.find((candidate) => candidate.path === open.path);
			if (!resource) return null;
			const text = takeaway !== null && takeaway.path === resource.path ? takeaway.text : null;
			const view = resourceCardView(resource, today, t, deps.markResourceFinished !== undefined, text);
			return {
				label: view.ariaLabel,
				content: (
					<ResourceCard
						view={view}
						busy={busy === 'mark'}
						onMark={() => act('mark', resource.path)}
						onOpenNote={() => openNote(resource.path)}
						renderMarkdown={deps.renderMarkdown}
						onFollowLink={() => modal.current?.close()}
						focusNote={focusNote.current}
					/>
				),
			};
		}
		const book = loaded.books.find((candidate) => candidate.path === open.path);
		if (!book) return null;
		const text = reflection !== null && reflection.path === book.path ? reflection.text : null;
		const view = bookCardView(book, today, t, { start: deps.startReading !== undefined, finish: deps.finishReading !== undefined }, text);
		return {
			label: view.ariaLabel,
			content: (
				<BookCard
					view={view}
					busy={busy === 'mark' ? null : busy}
					onStart={() => act('start', book.path)}
					onFinish={() => act('finish', book.path)}
					onOpenNote={() => openNote(book.path)}
					renderMarkdown={deps.renderMarkdown}
					onFollowLink={() => modal.current?.close()}
					focusNote={focusNote.current}
					idPrefix={idPrefix}
				/>
			),
		};
	};

	// The open card follows every render: the notes, the busy button and the language.
	useEffect(() => {
		if (card === null || library === null) return;
		const drawn = library.kind === 'loaded' ? cardContent(card, library) : null;
		if (!drawn) {
			// The note is gone (renamed, deleted) since the card opened, or the library could not be read again.
			modal.current?.close();
			return;
		}
		focusNote.current = false;
		if (modal.current) {
			modal.current.show(drawn.content);
			return;
		}
		modal.current = deps.openCard({
			label: drawn.label,
			lang: language,
			content: drawn.content,
			onClose: () => {
				modal.current = null;
				if (!mounted.current) return;
				setCard(null);
				void reload();
			},
		});
	});

	const loaded = library?.kind === 'loaded' ? library : null;
	const archive = inArchive && loaded ? archiveView(loaded.resources, today, { filter: pigeonhole, expanded: processedOpen }, t) : null;
	// A pigeonhole whose last resource left is no filter to keep: back to "Todos".
	const pigeonholeGone = archive !== null && archive.filter !== pigeonhole;
	useEffect(() => {
		if (pigeonholeGone) setPigeonhole('all');
	}, [pigeonholeGone]);
	const shelfView = !inArchive && shelf !== null && loaded ? libraryShelfView(loaded.books, shelf, today, t) : null;
	// A shelf whose last book left (archived, moved) is no place to be: back to the room.
	const shelfGone = !inArchive && shelf !== null && loaded !== null && shelfView === null;
	useEffect(() => {
		if (shelfGone) setShelf(null);
	}, [shelfGone]);

	const openArchive = (): void => {
		setPigeonhole('all');
		setProcessedOpen(false);
		setShelf(null);
		setInArchive(true);
	};
	const selectPigeonhole = (id: ArchiveFilter): void => {
		setPigeonhole(id);
		setProcessedOpen(false);
	};

	const back = inArchive
		? { label: t('library.back'), ariaLabel: t('library.back.aria'), onBack: () => setInArchive(false) }
		: shelfView
			? { label: shelfView.backLabel, ariaLabel: shelfView.backAria, onBack: () => setShelf(null) }
			: undefined;
	const title = inArchive ? t('archive.title') : shelfView ? shelfView.title : t('screen.library');
	return (
		<>
			<ScreenHeader title={title} character={character} back={back} />
			<div className="dromos-library" data-period={period} ref={body}>
				{library === null ? (
					<p className="dromos-library-note">{t('library.loading')}</p>
				) : library.kind === 'unreadable' ? (
					<p className="dromos-library-note is-error">{t('library.unreadable')}</p>
				) : archive ? (
					<ArchiveRoom view={archive} onSelect={selectPigeonhole} onOpenCard={openResourceCard} onToggleMore={() => setProcessedOpen((open) => !open)} idPrefix={idPrefix} />
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
						archive={archiveDoorView(library.resources, t)}
						onOpenArchive={openArchive}
					/>
				)}
			</div>
		</>
	);
}

/**
 * After the level on show changes (a shelf, the archive, or back to the room; not on the first
 * paint), scrolls the view back to the top and moves the focus to the header card's title, which
 * names the new level.
 */
function useLevelFocus(level: string | null, body: RefObject<HTMLElement>): void {
	const shown = useRef(level);
	useEffect(() => {
		if (shown.current === level) return;
		shown.current = level;
		const scroller = body.current?.closest<HTMLElement>('.dromos-root');
		if (scroller) scroller.scrollTop = 0;
		body.current?.parentElement?.querySelector<HTMLElement>('[data-screen-heading]')?.focus({ preventScroll: true });
	}, [level, body]);
}
