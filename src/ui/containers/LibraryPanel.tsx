import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { CampaignSnapshot, LoadLibrary, ReadReflection, ReadTakeaway, SyncCampaigns } from '../../application';
import type { Language } from '../../i18n';
import type { Clock } from '../../ports';
import type { MarkdownRender } from '../atoms/MarkdownBlock';
import { useT } from '../i18n';
import { ArchiveRoom } from '../organisms/ArchiveRoom';
import { LibraryRoom, type SendingHabit } from '../organisms/LibraryRoom';
import { LibraryShelf } from '../organisms/LibraryShelf';
import { ScreenHeader } from '../organisms/ScreenHeader';
import { archiveDoorView, archiveView, type ArchiveFilter } from '../presenters/archiveView';
import type { DayPeriod } from '../presenters/dayPeriod';
import { libraryHabitsView, libraryRoomView, libraryShelfView } from '../presenters/libraryView';
import { runHabitSend, type BookAction, type HabitSend } from './libraryActions';
import { useLibraryCards } from './useLibraryCards';

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
	/** Whether Obsidian's Web viewer opens external links in a tab (M8 S9); absent, the browser is assumed. */
	readonly linksOpenInObsidian?: () => boolean;
	/** The habits beside the desk (ADR-017). */
	readonly habits: LibraryHabitsDeps;
	readonly clock: Clock;
}

export interface LibraryPanelProps {
	readonly deps: LibraryDeps;
	/** The interface language, for the card, which opens outside the view. */
	readonly language: Language;
	/** The time of day: the desk's oil lamp is lit at night. */
	readonly period: DayPeriod;
	/** The home's sync counter: each bump the campaigns panel syncs, and the habits follow that sync. */
	readonly syncKey: number;
}

/**
 * Container of the library screen (M7 S5, M8 S2): reads the books and the archive's resources when
 * the screen opens, and opens their cards, through `useLibraryCards`, which the reading desk on
 * home shares (home-header S1). It holds which level is on show: the room, one shelf in its place,
 * or the archive (with its pigeonhole and whether its processed ones are unfolded), each but the
 * room with "← Biblioteca" in the header card.
 *
 * The habits beside the desk (ADR-017) are read from the campaigns' snapshot when the screen opens,
 * with no request; a sync still running then is joined. Each bump of `syncKey` after that joins the
 * sync the campaigns panel starts for it. "Enviar a Habitica" runs once at a time, reports its
 * outcome itself, then the vault is read again, so the sent habit loses its button.
 */
export function LibraryPanel({ deps, language, period, syncKey }: LibraryPanelProps) {
	const t = useT();
	const { library, openBook, openResource, idPrefix } = useLibraryCards(deps, language);
	const [shelf, setShelf] = useState<string | null>(null);
	// The archive (M8 S2) is on show in place of the room, with its pigeonhole and its unfolded processed ones.
	const [inArchive, setInArchive] = useState(false);
	const [pigeonhole, setPigeonhole] = useState<ArchiveFilter>('all');
	const [processedOpen, setProcessedOpen] = useState(false);
	const [habits, setHabits] = useState<CampaignSnapshot>(deps.habits.snapshot);
	const [sendingHabit, setSendingHabit] = useState<SendingHabit | null>(null);
	const sendingRef = useRef(false);
	const seenSyncKey = useRef(syncKey);
	const mounted = useRef(false);
	const body = useRef<HTMLDivElement>(null);
	const today = deps.clock.today();
	useLevelFocus(inArchive ? 'archive' : shelf === null ? null : `shelf:${shelf}`, body);

	useEffect(() => {
		mounted.current = true;
		return () => {
			mounted.current = false;
		};
	}, []);

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
			<ScreenHeader title={title} back={back} />
			<div className="dromos-library" data-period={period} ref={body}>
				{library === null ? (
					<p className="dromos-library-note">{t('library.loading')}</p>
				) : library.kind === 'unreadable' ? (
					<p className="dromos-library-note is-error">{t('library.unreadable')}</p>
				) : archive ? (
					<ArchiveRoom view={archive} onSelect={selectPigeonhole} onOpenCard={openResource} onToggleMore={() => setProcessedOpen((open) => !open)} idPrefix={idPrefix} />
				) : shelfView ? (
					<LibraryShelf view={shelfView} onOpenCard={openBook} idPrefix={idPrefix} />
				) : (
					<LibraryRoom
						view={libraryRoomView(library.books, today, t)}
						onOpenShelf={setShelf}
						onOpenCard={openBook}
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
