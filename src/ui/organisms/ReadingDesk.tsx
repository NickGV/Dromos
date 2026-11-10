import { ReadingLine } from '../molecules/ReadingLine';
import type { DeskView } from '../presenters/libraryView';

export interface ReadingDeskProps {
	readonly view: DeskView;
	/** Opens the card of the book at `path`, the same card as in the library. */
	readonly onOpenCard: (path: string) => void;
	/** Starts the ids of its heading and of the lines that describe the books, unique to the open view. */
	readonly idPrefix: string;
}

/**
 * The small reading desk on home (home-header S1): "Reading now" and the books being read, each on
 * one line of a parchment panel (home-fit S2) with a small scroll mark, its title, author and days;
 * the library's desk keeps the drawing. Each line is one button that opens the book's card.
 */
export function ReadingDesk({ view, onOpenCard, idPrefix }: ReadingDeskProps) {
	return (
		<section className="dromos-section dromos-reading-desk" aria-labelledby={`${idPrefix}-desk`}>
			<h2 className="dromos-card-title" id={`${idPrefix}-desk`}>
				{view.title}
			</h2>
			<ul className="dromos-panel dromos-reading-lines">
				{view.scrolls.map((scroll, index) => (
					<li key={scroll.path}>
						<ReadingLine view={scroll} onOpen={onOpenCard} sinceId={`${idPrefix}-since-${index}`} />
					</li>
				))}
			</ul>
		</section>
	);
}
