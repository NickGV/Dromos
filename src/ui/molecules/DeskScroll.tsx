import type { DeskScrollView } from '../presenters/libraryView';

export interface DeskScrollProps {
	readonly view: DeskScrollView;
	/** Opens the card of the book at `path`. */
	readonly onOpen: (path: string) => void;
	/** The id of its "Leyendo desde hace N días" line, which describes the button. */
	readonly sinceId?: string;
}

/**
 * A book on the reading desk (M7 S5): a papyrus unrolled on the desk (own-art L13), drawn by the
 * stylesheet, with its title, author and how long it has been read. The whole scroll is one button, named "Abrir la ficha de <title>"; the line of
 * days describes it.
 */
export function DeskScroll({ view, onOpen, sinceId }: DeskScrollProps) {
	return (
		<button type="button" className="dromos-desk-scroll" aria-label={view.openLabel} aria-describedby={sinceId} onClick={() => onOpen(view.path)}>
			<span className="dromos-desk-scroll-title">{view.title}</span>
			{view.author ? <span className="dromos-desk-scroll-author">{view.author}</span> : null}
			<span className="dromos-desk-scroll-since" id={sinceId}>
				{view.since}
			</span>
		</button>
	);
}
