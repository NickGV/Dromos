import { AlcoveArt } from '../atoms/AlcoveArt';
import { DeskArt, WallArt } from '../atoms/LibraryArt';
import { SceneLayers } from '../atoms/SceneLayers';
import { AlcoveButton } from '../molecules/AlcoveButton';
import { ArchiveDoor } from '../molecules/ArchiveDoor';
import { DeskScroll } from '../molecules/DeskScroll';
import { HabitRow } from '../molecules/HabitRow';
import type { ArchiveDoorView } from '../presenters/archiveView';
import type { LibraryHabitsView, LibraryRoomView } from '../presenters/libraryView';

/** A habit beside the desk on its way to Habitica: the area it is declared in and its title. */
export interface SendingHabit {
	readonly areaPath: string;
	readonly title: string;
}

export interface LibraryRoomProps {
	readonly view: LibraryRoomView;
	/** Opens the shelf `id` in place of the room. */
	readonly onOpenShelf: (id: string) => void;
	/** Opens the card of the book at `path`. */
	readonly onOpenCard: (path: string) => void;
	/** Starts the ids of the lines that describe the scrolls, unique to the open view. */
	readonly idPrefix?: string;
	/** The areas' reading habits, drawn right after the desk (ADR-017); absent or `null`, no block. */
	readonly habits?: LibraryHabitsView | null;
	/** The habit on its way to Habitica, or `null`. */
	readonly sendingHabit?: SendingHabit | null;
	/** "Enviar a Habitica" for the habit `title` of the area at `areaPath`. */
	readonly onSendHabit?: (areaPath: string, title: string) => void;
	/** The doorway "El archivo" in the wall, after the alcoves (M8 S2); absent or `null`, no doorway. */
	readonly archive?: ArchiveDoorView | null;
	/** Opens the archive in place of the room. */
	readonly onOpenArchive?: () => void;
}

/**
 * The reading room, level 1 of the library (M7 S5): the summary, then the wall with one alcove per
 * shelf, the reading desk with the books being read, and the reading habits right after the desk
 * (ADR-017), each with its streak and, while unsent, "Enviar a Habitica". The wall comes first, as
 * the back of the room on wide panes; on phones the stylesheet puts the desk and the habits first,
 * so what is being read shows without scrolling. Each scene is built in layers (S6). An empty
 * library keeps a bare niche and a bare desk, which says so. When given, the doorway to the archive
 * (M8 S2) opens in the wall after the alcoves, in an empty library too.
 */
export function LibraryRoom({ view, onOpenShelf, onOpenCard, idPrefix = 'dromos-library', habits = null, sendingHabit = null, onSendHabit, archive = null, onOpenArchive }: LibraryRoomProps) {
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
					{archive ? (
						<div className="dromos-archive-doorway">
							<ArchiveDoor view={archive} onOpen={() => onOpenArchive?.()} />
						</div>
					) : null}
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
			{habits ? (
				<section className="dromos-section dromos-library-habits" aria-labelledby={`${idPrefix}-habits`}>
					<h3 className="dromos-card-title" id={`${idPrefix}-habits`}>
						{habits.title}
					</h3>
					<ul className="dromos-panel dromos-habit-list">
						{habits.rows.map(({ areaPath, row }, index) => (
							<HabitRow
								key={`${areaPath}:${index}:${row.title}`}
								row={row}
								sending={sendingHabit !== null && sendingHabit.areaPath === areaPath && sendingHabit.title === row.title}
								onSend={() => onSendHabit?.(areaPath, row.title)}
							/>
						))}
					</ul>
				</section>
			) : null}
		</div>
	);
}
