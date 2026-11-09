import { REFLECTION_SECTIONS, type Book, type ReflectionSectionId } from '../../domain';
import type { MessageKey, Translator } from '../../i18n';
import type { ReflectionText } from '../../ports';
import { longDate } from './dates';
import { readingSince, shelfName, shownBooks, stateLabel, type ShownBookState } from './libraryView';

/** Which state actions are wired: each one absent takes its button away (M7 S5, before U4). */
export interface BookCardActions {
	readonly start: boolean;
	readonly finish: boolean;
}

/** The book card, level 3 of the library (M7 S5): one scroll unrolled in a modal. */
export interface BookCardView {
	readonly path: string;
	readonly title: string;
	/** "C. S. Lewis · Teología": the author, when the note has one, and the shelf. */
	readonly byline: string;
	readonly state: ShownBookState;
	readonly stateLabel: string;
	/** "Empezado el 25 de octubre · Leyendo desde hace 12 días", "Terminado el 3 de octubre"; `null` without dates. */
	readonly dates: string | null;
	/** The accessible name of the list of sections. */
	readonly sectionsLabel: string;
	/** The four sections of the reflection, each with its text once read, or whether it is written. */
	readonly sections: readonly BookCardSectionView[];
	readonly seal: { readonly sealed: boolean; readonly text: string };
	readonly actions: BookCardActionsView;
	/** The accessible name of the modal, "Ficha de <title>". */
	readonly ariaLabel: string;
}

export interface BookCardSectionView {
	readonly id: ReflectionSectionId;
	readonly heading: string;
	/** From the cache, as the seal counts it (Q026); the text never changes it. */
	readonly written: boolean;
	/** "Escrita" or "Sin escribir todavía": what the card says while it shows no text. */
	readonly status: string;
	/** The markdown the user wrote in a written part, shown read-only in place of `status`; `null` shows `status`. */
	readonly text: string | null;
}

export interface BookCardActionsView {
	/** "Empezar a leer", for a pending book when the action is wired. */
	readonly start: { readonly label: string; readonly hint: string; readonly busyLabel: string } | null;
	/** "Terminar", for a book being read when the action is wired. */
	readonly finish: { readonly label: string; readonly busyLabel: string } | null;
	/** "Abrir la nota", always; the primary button for a finished book that misses its reflection. */
	readonly openNote: { readonly label: string; readonly primary: boolean };
}

const SECTION_HEADINGS: Readonly<Record<ReflectionSectionId, MessageKey>> = {
	about: 'library.section.about',
	kept: 'library.section.kept',
	changes: 'library.section.changes',
	connects: 'library.section.connects',
};

/**
 * The card of `book` (M7 S5): its byline, state and dates, the four sections of the reflection, the
 * seal, and the buttons its state allows. A written part shows the text of `reflection` (S2);
 * while that is not there yet, or could not be read (`null`), or came back empty, it says
 * "Escrita". A part the cache does not count as written says "Sin escribir todavía", whatever the
 * note holds there: what is written, the state and the seal come from the cache alone (Q026).
 * Only "Empezar a leer" and "Terminar" change a book, and only when wired in `actions`; "Abrir la
 * nota" is always there, because the reflection is written in the note. An archived book reads as
 * pending: the library never opens one, so this is only a fallback.
 */
export function bookCardView(book: Book, today: string, t: Translator, actions: BookCardActions, reflection: ReflectionText | null = null): BookCardView {
	const state = shownBooks([book])[0]?.state ?? 'pending';
	const written = new Set(book.reflection.filter((section) => section.written).map((section) => section.id));
	return {
		path: book.path,
		title: book.title,
		byline: [book.author, shelfName(book.shelf, t)].filter((part): part is string => part !== null).join(' · '),
		state,
		stateLabel: stateLabel(state, t),
		dates: datesText(book, state, today, t),
		sectionsLabel: t('library.card.reflection'),
		sections: REFLECTION_SECTIONS.map(({ id }) => ({
			id,
			heading: t(SECTION_HEADINGS[id]),
			written: written.has(id),
			status: t(written.has(id) ? 'library.section.written' : 'library.section.unwritten'),
			text: written.has(id) && reflection !== null && reflection[id] !== '' ? reflection[id] : null,
		})),
		seal: sealView(state, t),
		actions: {
			start: state === 'pending' && actions.start ? { label: t('library.card.start'), hint: t('library.card.start.hint'), busyLabel: t('library.card.starting') } : null,
			finish: state === 'reading' && actions.finish ? { label: t('library.card.finish'), busyLabel: t('library.card.finishing') } : null,
			openNote: { label: t('library.card.openNote'), primary: state === 'reflection-missing' },
		},
		ariaLabel: t('library.card.aria', { title: book.title }),
	};
}

function datesText(book: Book, state: ShownBookState, today: string, t: Translator): string | null {
	if (state === 'pending') return null;
	const parts: string[] = [];
	if (book.started !== null) {
		parts.push(t('library.card.started', { date: longDate(book.started, today, t) }));
		if (state === 'reading') parts.push(readingSince(book.started, today, t));
	}
	const finished = state === 'sealed' || state === 'reflection-missing';
	if (finished && book.finished !== null) parts.push(t('library.card.finished', { date: longDate(book.finished, today, t) }));
	return parts.length === 0 ? null : parts.join(' · ');
}

function sealView(state: ShownBookState, t: Translator): BookCardView['seal'] {
	if (state === 'sealed') return { sealed: true, text: t('library.seal.sealed') };
	if (state === 'reflection-missing') return { sealed: false, text: t('library.seal.missing') };
	return { sealed: false, text: t('library.seal.later') };
}
