import { ScrollArt } from '../atoms/ScrollArt';
import type { ShelfScrollView } from '../presenters/libraryView';

export interface ShelfScrollButtonProps {
	readonly view: ShelfScrollView;
	/** Opens the card of the book at `path`. */
	readonly onOpen: (path: string) => void;
	/** The id of its state line, which describes the button. */
	readonly stateId?: string;
}

/**
 * One scroll on a shelf (M7 S5): the scroll drawn in its state, the sillybos (the parchment tag
 * hanging from it) with the title and the author, and the state in words. The whole scroll is one
 * button, named "Abrir la ficha de <title>"; the state line describes it.
 */
export function ShelfScrollButton({ view, onOpen, stateId }: ShelfScrollButtonProps) {
	return (
		<button type="button" className={`dromos-shelf-scroll is-${view.state}`} aria-label={view.openLabel} aria-describedby={stateId} onClick={() => onOpen(view.path)}>
			<ScrollArt state={view.state} />
			<span className="dromos-sillybos">
				<span className="dromos-sillybos-title">{view.title}</span>
				{view.author ? <span className="dromos-sillybos-author">{view.author}</span> : null}
			</span>
			<span className="dromos-shelf-scroll-status" id={stateId}>
				<span className="dromos-shelf-scroll-state">{view.stateLabel}</span>
				{view.note ? <span className="dromos-shelf-scroll-note">{view.note}</span> : null}
			</span>
		</button>
	);
}
