import type { FinishReadingOutcome, ReadingTodo, StartReadingOutcome } from '../../application';
import { REFLECTION_SECTIONS, type Book, type ReflectionSectionId } from '../../domain';
import type { MessageKey, Translator } from '../../i18n';
import { habiticaFailureView, type LinkOutcomeView } from './linkOutcomeView';

const ITEM_KEYS: Readonly<Record<ReflectionSectionId, MessageKey>> = {
	about: 'library.todo.item.about',
	kept: 'library.todo.item.kept',
	changes: 'library.todo.item.changes',
	connects: 'library.todo.item.connects',
};

/**
 * The to-do "Empezar a leer" creates (M7 S3): "Leer: <title>", a link to the book's note, and a
 * checklist of "Terminar de leer" plus the four parts of the reflection, in the note's order, so
 * Habitica shows it as a mission of five.
 */
export function readingTodo(book: Pick<Book, 'title' | 'path'>, t: Translator, noteLink: (path: string) => string): ReadingTodo {
	return {
		title: t('library.todo.title', { title: book.title }),
		notes: `Dromos · ${book.title}\n${noteLink(book.path)}`,
		checklist: [t('library.todo.item.finish'), ...REFLECTION_SECTIONS.map(({ id }) => t(ITEM_KEYS[id]))],
	};
}

/** The toast shown after "Empezar a leer" or "Terminar". */
export function readingOutcomeView(outcome: StartReadingOutcome | FinishReadingOutcome, t: Translator): LinkOutcomeView {
	switch (outcome.kind) {
		case 'started':
			return { tone: 'success', message: t('library.outcome.started') };
		case 'finished':
			return { tone: 'success', message: t('library.outcome.finished') };
		case 'not-found':
			return { tone: 'warning', message: t('library.outcome.notFound') };
		case 'not-pending':
			return { tone: 'neutral', message: t('library.outcome.notPending') };
		case 'not-reading':
			return { tone: 'neutral', message: t('library.outcome.notReading') };
		case 'habitica-failed':
			return habiticaFailureView(outcome.error, t);
		case 'duplicate':
			return { tone: 'warning', message: t('library.outcome.duplicate', { id: outcome.habiticaId }) };
		case 'write-failed':
			return 'habiticaId' in outcome
				? { tone: 'error', message: t('library.outcome.writeFailed', { id: outcome.habiticaId }) }
				: { tone: 'error', message: t('library.outcome.finishWriteFailed') };
	}
}
