import { ArchiveRackArt } from '../atoms/ArchiveArt';
import { ResourceArt } from '../atoms/ResourceArt';
import type { ArchiveFilter, PigeonholeView } from '../presenters/archiveView';

export interface ArchivePigeonholeProps {
	readonly view: PigeonholeView;
	/** Shows the pigeonhole `id` in the list. */
	readonly onSelect: (id: ArchiveFilter) => void;
}

/**
 * One pigeonhole of the archive's rack (M8 S4): a filter button, pressed while its kind is on show,
 * with the kind's object, its name and what is not processed in it ("Artículos 3"). On a phone the
 * stylesheet makes it a chip.
 */
export function ArchivePigeonhole({ view, onSelect }: ArchivePigeonholeProps) {
	return (
		<button type="button" className={view.selected ? 'dromos-pigeonhole is-selected' : 'dromos-pigeonhole'} aria-pressed={view.selected} onClick={() => onSelect(view.id)}>
			{view.id === 'all' ? <ArchiveRackArt /> : <ResourceArt kind={view.id} />}
			<span className="dromos-pigeonhole-label">
				{view.label} <span className="dromos-pigeonhole-count">{view.count}</span>
			</span>
		</button>
	);
}
