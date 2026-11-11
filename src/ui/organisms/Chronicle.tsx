import { ListToggle } from '../atoms/ListToggle';
import { DeedList } from '../molecules/DeedList';
import type { ChronicleView } from '../presenters/chronicleView';

export interface ChronicleProps {
	readonly view: ChronicleView;
	/** The id of the list of deeds, unique in the window: the "View more" toggle controls it. */
	readonly listId: string;
	/** Shows every deed, or folds back to the three newest (home-fit S2). */
	readonly onToggleMore?: () => void;
}

/**
 * The chronicle of deeds on the home screen (game-ui S18): the section title, then the last deeds
 * of the ledger as journal lines, newest first, "Yesterday · Read 20 pages · Reader +10 XP". A deed
 * undone reads "Undone". Folded to the three newest, "View more" under them shows the rest (home-fit S2).
 */
export function Chronicle({ view, listId, onToggleMore }: ChronicleProps) {
	return (
		<section className="dromos-section dromos-chronicle" aria-label={view.title}>
			<h2 className="dromos-card-title">{view.title}</h2>
			<div className="dromos-panel dromos-chronicle-panel">
				<DeedList lines={view.lines} id={listId} />
				{view.more ? <ListToggle view={view.more} onToggle={onToggleMore} controls={listId} /> : null}
			</div>
		</section>
	);
}
