import { ScrollArt } from '../atoms/ScrollArt';
import type { DeskScrollView } from '../presenters/libraryView';

export interface ReadingLineProps {
	readonly view: DeskScrollView;
	/** Opens the card of the book at `path`. */
	readonly onOpen: (path: string) => void;
	/** The id of its "Reading for N days" text, which describes the button. */
	readonly sinceId: string;
}

/**
 * A book being read, on one line of the small desk of home (home-fit S2): a small scroll mark, the
 * title, the author and how long it has been read. The whole line is one button, named "Open the
 * card of <title>", that opens the same card as the library's desk; the line of days describes it.
 */
export function ReadingLine({ view, onOpen, sinceId }: ReadingLineProps) {
	return (
		<button type="button" className="dromos-reading-line" aria-label={view.openLabel} aria-describedby={sinceId} onClick={() => onOpen(view.path)}>
			<ScrollArt state="reading" />
			<span className="dromos-reading-line-book">
				<span className="dromos-reading-line-title">{view.title}</span>
				{view.author ? (
					<>
						{' '}
						<span className="dromos-reading-line-author">{view.author}</span>
					</>
				) : null}
			</span>
			<span className="dromos-reading-line-since" id={sinceId}>
				{view.since}
			</span>
		</button>
	);
}
