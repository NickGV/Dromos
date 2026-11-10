import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LibraryState } from '../../application';
import type { Language } from '../../i18n';
import type { ReflectionText } from '../../ports';
import { useT } from '../i18n';
import { BookCard, type BookCardBusy } from '../organisms/BookCard';
import { ResourceCard } from '../organisms/ResourceCard';
import { bookCardView } from '../presenters/bookCardView';
import { resourceCardView } from '../presenters/resourceCardView';
import type { CardModal, LibraryDeps } from './LibraryPanel';
import { closeForWebViewer, reflectionLoader, runBookAction } from './libraryActions';

/** Numbers the open libraries and home desks, so the ids of each one's described buttons are its own. */
let libraryCount = 0;

/** The card open over the workspace: a book's or a resource's, by the path of its note. */
interface OpenCard {
	readonly kind: 'book' | 'resource';
	readonly path: string;
}

/** The state action under way: a book's "Empezar a leer" or "Terminar", or a resource's "Marcar como leído". */
type LibraryBusy = BookCardBusy | 'mark';

/** The library as read for a screen, and the cards it opens. */
export interface LibraryCards {
	/** `null` while the first read runs: saying the library is empty would be a guess. */
	readonly library: LibraryState | null;
	/** Opens the card of the book at `path`. */
	readonly openBook: (path: string) => void;
	/** Opens the card of the resource at `path`. */
	readonly openResource: (path: string) => void;
	/** Starts the ids of the described buttons and of the card's parts, unique to this screen. */
	readonly idPrefix: string;
}

/**
 * The library's reading and its cards (M7 S5, M8 S6), shared by the library screen and the reading
 * desk on home (home-header S1): reads the books and the archive's resources when the screen opens,
 * after a state action and when a card closes (the note may have been written meanwhile); none of
 * it touches the network. A card, a book's or a resource's, opens through `deps.openCard` and is
 * drawn again on every render, so it follows the notes; a state action runs once at a time, and the
 * notes are read again when it settles. The text of a book's reflection, or of what a resource
 * left, is read each time its card opens and after each state action, and the card is drawn again
 * when it arrives; until then the card says "Escrita" ("Escrito"). "Abrir la nota", or a link
 * followed in that text, closes the card and opens the note. Leaving the screen closes the card.
 */
export function useLibraryCards(deps: LibraryDeps, language: Language): LibraryCards {
	const t = useT();
	const [library, setLibrary] = useState<LibraryState | null>(null);
	const [card, setCard] = useState<OpenCard | null>(null);
	const [busy, setBusy] = useState<LibraryBusy>(null);
	// The text of the open card's reflection, with the path it was read for; `null` while none is read.
	const [reflection, setReflection] = useState<{ readonly path: string; readonly text: ReflectionText | null } | null>(null);
	// The same for what a resource left (M8 S6).
	const [takeaway, setTakeaway] = useState<{ readonly path: string; readonly text: string | null } | null>(null);
	const [idPrefix] = useState(() => `dromos-library-${(libraryCount += 1)}`);
	const acting = useRef(false);
	const focusNote = useRef(false);
	const modal = useRef<CardModal | null>(null);
	const mounted = useRef(false);
	const today = deps.clock.today();

	const reload = useCallback(async (): Promise<void> => {
		const next = await deps.loadLibrary.execute();
		if (mounted.current) setLibrary(next);
	}, [deps]);

	const reflections = useMemo(() => reflectionLoader(deps.readReflection, (path, text) => setReflection({ path, text })), [deps.readReflection]);
	useEffect(() => () => reflections.stop(), [reflections]);
	const takeaways = useMemo(() => reflectionLoader<string>(deps.readTakeaway, (path, text) => setTakeaway({ path, text })), [deps.readTakeaway]);
	useEffect(() => () => takeaways.stop(), [takeaways]);

	// Every open reads the note again: the reflection may have been written since the card last closed.
	const openBook = (path: string): void => {
		setReflection(null);
		setCard({ kind: 'book', path });
		reflections.load(path);
	};

	// The same for a resource: what it left may have been written since its card last closed.
	const openResource = (path: string): void => {
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
						onOpenLink={closeForWebViewer(deps.linksOpenInObsidian, () => modal.current?.close())}
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
			// The focus asked for this card is dropped with it, so the next card opens with no jump.
			focusNote.current = false;
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

	return { library, openBook, openResource, idPrefix };
}
