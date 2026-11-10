import { DeskArt } from '../atoms/LibraryArt';
import { SceneLayers } from '../atoms/SceneLayers';
import { DeskScroll } from '../molecules/DeskScroll';
import type { DayPeriod } from '../presenters/dayPeriod';
import type { DeskView } from '../presenters/libraryView';

export interface ReadingDeskProps {
	readonly view: DeskView;
	/** Opens the card of the book at `path`, the same card as in the library. */
	readonly onOpenCard: (path: string) => void;
	/** Starts the ids of its heading and of the lines that describe the scrolls, unique to the open view. */
	readonly idPrefix: string;
	/** The time of day: the desk's oil lamp is lit at night, as in the library. */
	readonly period: DayPeriod;
}

/**
 * The small reading desk on home (home-header S1): "Reading now" and the books being read, drawn
 * as the library's desk draws them (M7 S5), in its layers, wood and lamp, only smaller. Each scroll
 * is one button that opens the book's card.
 */
export function ReadingDesk({ view, onOpenCard, idPrefix, period }: ReadingDeskProps) {
	return (
		<section className="dromos-section dromos-reading-desk" aria-labelledby={`${idPrefix}-desk`} data-period={period}>
			<h2 className="dromos-card-title" id={`${idPrefix}-desk`}>
				{view.title}
			</h2>
			<SceneLayers scene="desk" className="dromos-panel is-mini" drawing={<DeskArt />}>
				<ul className="dromos-desk-scrolls">
					{view.scrolls.map((scroll, index) => (
						<li key={scroll.path}>
							<DeskScroll view={scroll} onOpen={onOpenCard} sinceId={`${idPrefix}-since-${index}`} />
						</li>
					))}
				</ul>
			</SceneLayers>
		</section>
	);
}
