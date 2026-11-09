import { AlcoveArt } from '../atoms/AlcoveArt';
import type { AlcoveView } from '../presenters/libraryView';

export interface AlcoveButtonProps {
	readonly view: AlcoveView;
	/** Opens the shelf `id` in place of the room. */
	readonly onOpen: (id: string) => void;
}

/**
 * One alcove of the library wall (M7 S5): the whole alcove is one button, its niche drawn above
 * the shelf's name and, on a line of its own, its count, so a long name never breaks around it.
 */
export function AlcoveButton({ view, onOpen }: AlcoveButtonProps) {
	return (
		<button type="button" className="dromos-alcove" aria-label={view.openLabel} onClick={() => onOpen(view.id)}>
			<AlcoveArt scrolls={view.scrolls} capsa={view.capsa} />
			<span className="dromos-alcove-label">
				<span className="dromos-alcove-name">{view.name}</span>
				<span className="dromos-alcove-count">{view.countText}</span>
			</span>
		</button>
	);
}
