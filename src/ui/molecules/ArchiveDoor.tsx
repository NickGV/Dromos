import { ArchiveDoorArt } from '../atoms/ArchiveArt';
import type { ArchiveDoorView } from '../presenters/archiveView';

export interface ArchiveDoorProps {
	readonly view: ArchiveDoorView;
	/** Opens the archive in place of the room. */
	readonly onOpen: () => void;
}

/**
 * The doorway "El archivo" in the reading room's wall (M8 S2): the whole doorway is one button, its
 * arch drawn beside the name and, on a line of its own, what is not processed yet.
 */
export function ArchiveDoor({ view, onOpen }: ArchiveDoorProps) {
	return (
		<button type="button" className="dromos-archive-door" aria-label={view.openLabel} onClick={onOpen}>
			<ArchiveDoorArt />
			<span className="dromos-archive-door-label">
				<span className="dromos-archive-door-name">{view.name}</span>
				<span className="dromos-archive-door-count">{view.countText}</span>
			</span>
		</button>
	);
}
