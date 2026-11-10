import { ListToggle } from '../atoms/ListToggle';
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
 * undone reads "Undone". Each part stays whole when a line wraps, and the dot before a part keeps
 * to the end of the line, never the start of the next. Folded to the three newest, "View more"
 * under them shows the rest (home-fit S2).
 */
export function Chronicle({ view, listId, onToggleMore }: ChronicleProps) {
	return (
		<section className="dromos-section dromos-chronicle" aria-label={view.title}>
			<h2 className="dromos-card-title">{view.title}</h2>
			<div className="dromos-panel dromos-chronicle-panel">
				<ol className="dromos-deeds" id={listId}>
					{view.lines.map((line) => (
						<li key={line.key} className={line.undone ? 'dromos-deed is-undone' : 'dromos-deed'}>
							<span className="dromos-deed-day">{line.day}</span>
							{line.parts.map((part, index) => (
								<span key={index} className={partClass(index, line.parts.length, line.undone)}>
									{' · '}
									<span className="dromos-deed-text">{part}</span>
								</span>
							))}
						</li>
					))}
				</ol>
				{view.more ? <ListToggle view={view.more} onToggle={onToggleMore} controls={listId} /> : null}
			</div>
		</section>
	);
}

/** The last part is what the deed gained; the first of an undone deed is the word "Undone". */
function partClass(index: number, count: number, undone: boolean): string {
	if (index === count - 1) return 'dromos-deed-part is-gain';
	if (undone && index === 0) return 'dromos-deed-part is-undone';
	return 'dromos-deed-part is-task';
}
