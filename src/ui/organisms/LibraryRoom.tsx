import { AlcoveArt } from '../atoms/AlcoveArt';
import { DeskArt, WallArt } from '../atoms/LibraryArt';
import { SceneLayers } from '../atoms/SceneLayers';
import { AlcoveButton } from '../molecules/AlcoveButton';
import { DeskScroll } from '../molecules/DeskScroll';
import type { LibraryRoomView } from '../presenters/libraryView';

export interface LibraryRoomProps {
	readonly view: LibraryRoomView;
	/** Opens the shelf `id` in place of the room. */
	readonly onOpenShelf: (id: string) => void;
	/** Opens the card of the book at `path`. */
	readonly onOpenCard: (path: string) => void;
	/** Starts the ids of the lines that describe the scrolls, unique to the open view. */
	readonly idPrefix?: string;
}

/**
 * The reading room, level 1 of the library (M7 S5): the summary, then the wall with one alcove per
 * shelf and the reading desk with the books being read. The wall comes first, as the back of the
 * room on wide panes; on phones the stylesheet puts the desk first, so what is being read shows
 * without scrolling. Each scene is built in layers (S6). An empty library keeps a bare niche and a
 * bare desk, which says so.
 */
export function LibraryRoom({ view, onOpenShelf, onOpenCard, idPrefix = 'dromos-library' }: LibraryRoomProps) {
	const deskLine = view.empty ?? view.desk.empty;
	return (
		<div className="dromos-library-room">
			{view.summary ? <p className="dromos-library-summary">{view.summary}</p> : null}
			<section className="dromos-section dromos-library-wall" aria-labelledby={`${idPrefix}-wall`}>
				<h3 className="dromos-card-title" id={`${idPrefix}-wall`}>
					{view.shelvesTitle}
				</h3>
				<SceneLayers scene="wall" className="dromos-panel" drawing={<WallArt />}>
					{view.alcoves.length === 0 ? (
						<div className="dromos-alcoves is-bare">
							<AlcoveArt scrolls={0} capsa={false} />
						</div>
					) : (
						<ul className="dromos-alcoves">
							{view.alcoves.map((alcove) => (
								<li key={alcove.id}>
									<AlcoveButton view={alcove} onOpen={onOpenShelf} />
								</li>
							))}
						</ul>
					)}
				</SceneLayers>
			</section>
			<section className="dromos-section dromos-library-desk" aria-labelledby={`${idPrefix}-desk`}>
				<h3 className="dromos-card-title" id={`${idPrefix}-desk`}>
					{view.desk.title}
				</h3>
				<SceneLayers scene="desk" className="dromos-panel" drawing={<DeskArt />}>
					{view.desk.scrolls.length > 0 ? (
						<ul className="dromos-desk-scrolls">
							{view.desk.scrolls.map((scroll, index) => (
								<li key={scroll.path}>
									<DeskScroll view={scroll} onOpen={onOpenCard} sinceId={`${idPrefix}-since-${index}`} />
								</li>
							))}
						</ul>
					) : null}
					{deskLine ? <p className="dromos-library-desk-empty">{deskLine}</p> : null}
				</SceneLayers>
			</section>
		</div>
	);
}
