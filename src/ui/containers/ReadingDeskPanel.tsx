import type { Language } from '../../i18n';
import { useT } from '../i18n';
import { ReadingDesk } from '../organisms/ReadingDesk';
import type { DayPeriod } from '../presenters/dayPeriod';
import { homeDeskView } from '../presenters/libraryView';
import type { LibraryDeps } from './LibraryPanel';
import { useLibraryCards } from './useLibraryCards';

export interface ReadingDeskPanelProps {
	readonly deps: LibraryDeps;
	/** The interface language, for the card, which opens outside the view. */
	readonly language: Language;
	/** The time of day: the desk's oil lamp is lit at night. */
	readonly period: DayPeriod;
}

/**
 * Container of the small reading desk on home (home-header S1): reads the library as the library
 * screen does, through `useLibraryCards`, when home opens, and draws the books being read; a click
 * opens the same book card, with all its actions. While the library is read, when it cannot be
 * read, and while no book is being read, it draws nothing.
 */
export function ReadingDeskPanel({ deps, language, period }: ReadingDeskPanelProps) {
	const t = useT();
	const { library, openBook, idPrefix } = useLibraryCards(deps, language);
	const view = homeDeskView(library, deps.clock.today(), t);
	return view ? <ReadingDesk view={view} onOpenCard={openBook} idPrefix={idPrefix} period={period} /> : null;
}
