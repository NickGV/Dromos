import { ArchiveRoomArt } from '../atoms/ArchiveArt';
import { ListToggle } from '../atoms/ListToggle';
import { SceneLayers } from '../atoms/SceneLayers';
import { ArchivePigeonhole } from '../molecules/ArchivePigeonhole';
import { ResourceRow } from '../molecules/ResourceRow';
import type { ArchiveFilter, ArchiveView } from '../presenters/archiveView';

export interface ArchiveRoomProps {
	readonly view: ArchiveView;
	/** Shows the pigeonhole `id` in the list. */
	readonly onSelect: (id: ArchiveFilter) => void;
	/** Opens the card of the resource at `path`. */
	readonly onOpenCard: (path: string) => void;
	/** "Ver más (N)" / "Ver menos" under the processed ones. */
	readonly onToggleMore: () => void;
	/** Starts the ids of the headings and of the lines that describe the titles, unique to the open view. */
	readonly idPrefix?: string;
}

/**
 * The archive, a level of the library shown in place of the room (M8 S5): the room first, the
 * window and the worktable with the rack of pigeonholes as filter buttons, built in layers as the
 * library's scenes are; then the summary; then the sections, each resource a row whose title opens
 * its card. On a phone the stylesheet shrinks the room and makes the pigeonholes a row of chips;
 * the order stays the same. An empty archive keeps its room and says so.
 */
export function ArchiveRoom({ view, onSelect, onOpenCard, onToggleMore, idPrefix = 'dromos-library' }: ArchiveRoomProps) {
	return (
		<div className="dromos-archive">
			<SceneLayers scene="archive" className="dromos-panel" drawing={<ArchiveRoomArt />}>
				{view.pigeonholes.length > 0 ? (
					<div className="dromos-pigeonholes" role="group" aria-label={view.pigeonholesLabel}>
						{view.pigeonholes.map((pigeonhole) => (
							<ArchivePigeonhole key={pigeonhole.id} view={pigeonhole} onSelect={onSelect} />
						))}
					</div>
				) : null}
			</SceneLayers>
			{view.summary ? <p className="dromos-archive-summary">{view.summary}</p> : null}
			{view.empty ? <p className="dromos-archive-empty">{view.empty}</p> : null}
			{view.sections.map((section) => (
				<section key={section.id} className={`dromos-section dromos-archive-section is-${section.id}`} aria-labelledby={`${idPrefix}-archive-${section.id}`}>
					<h3 className="dromos-card-title" id={`${idPrefix}-archive-${section.id}`}>
						{section.title}
					</h3>
					<div className="dromos-panel dromos-resource-panel">
						<ul className="dromos-resource-list">
							{section.rows.map((row, index) => (
								<ResourceRow key={row.path} view={row} onOpen={onOpenCard} stateId={`${idPrefix}-archive-${section.id}-${index}`} />
							))}
						</ul>
						{section.more ? <ListToggle view={section.more} onToggle={onToggleMore} /> : null}
					</div>
				</section>
			))}
		</div>
	);
}
