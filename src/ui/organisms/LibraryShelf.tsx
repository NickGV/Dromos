import { ShelfArt } from '../atoms/LibraryArt';
import { SceneLayers } from '../atoms/SceneLayers';
import { ShelfScrollButton } from '../molecules/ShelfScrollButton';
import type { LibraryShelfView } from '../presenters/libraryView';
import type { SceneArtView } from '../presenters/sceneArtView';

export interface LibraryShelfProps {
	readonly view: LibraryShelfView;
	/** Opens the card of the book at `path`. */
	readonly onOpenCard: (path: string) => void;
	/** Starts the ids of the state lines that describe the scrolls, unique to the open view. */
	readonly idPrefix?: string;
	/** The user's paintings, of which the shelf takes its own (own-art L16); absent or `null`, it is drawn. */
	readonly art?: SceneArtView | null;
}

/**
 * One shelf, level 2 of the library (M7 S5): the alcove up close, its books on planks, reading,
 * pending and finished, a plank with no book left out. Scrolls stand side by side and wrap to the
 * next line, so a short row leaves no empty side. Built in layers (S6); the user's painting, when given,
 * replaces the niche's drawing, and the row titles and states then sit on parchment (own-art L16).
 */
export function LibraryShelf({ view, onOpenCard, idPrefix = 'dromos-library', art = null }: LibraryShelfProps) {
	return (
		<SceneLayers scene="shelf" className="dromos-library-shelf" drawing={<ShelfArt />} painting={art?.shelf}>
			{view.rows.map((row) => (
				<section key={row.id} className={`dromos-shelf-row is-${row.id}`} aria-labelledby={`${idPrefix}-row-${row.id}`}>
					<h3 className="dromos-shelf-row-title" id={`${idPrefix}-row-${row.id}`}>
						{row.title}
					</h3>
					<ul className="dromos-shelf-scrolls">
						{row.scrolls.map((scroll, index) => (
							<li key={scroll.path}>
								<ShelfScrollButton view={scroll} onOpen={onOpenCard} stateId={`${idPrefix}-state-${row.id}-${index}`} />
							</li>
						))}
					</ul>
				</section>
			))}
		</SceneLayers>
	);
}
