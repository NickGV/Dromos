import type { DeedLineView } from '../presenters/chronicleView';

export interface DeedListProps {
	readonly lines: readonly DeedLineView[];
	/** The list's id, when a toggle controls it. */
	readonly id?: string;
}

/**
 * Deeds as journal lines, newest first (game-ui S18): "Yesterday · Read 20 pages · Reader +10 XP". A
 * deed undone reads "Undone". Each part stays whole when a line wraps, and the dot before a part keeps
 * to the end of the line, never the start of the next. The home chronicle and the Chronicle screen's
 * week (M9 S2) both list them so.
 */
export function DeedList({ lines, id }: DeedListProps) {
	return (
		<ol className="dromos-deeds" id={id}>
			{lines.map((line) => (
				<li key={line.key} className={line.undone ? 'dromos-deed is-undone' : 'dromos-deed'}>
					<span className="dromos-deed-day">{line.day}</span>
					{line.parts.map((part, index) => (
						<span key={index} className={partClass(index, line.parts.length, line.undone)}>
							{' · '}
							<span className="dromos-deed-text">{part}</span>
						</span>
					))}
				</li>
			))}
		</ol>
	);
}

/** The last part is what the deed gained; the first of an undone deed is the word "Undone". */
function partClass(index: number, count: number, undone: boolean): string {
	if (index === count - 1) return 'dromos-deed-part is-gain';
	if (undone && index === 0) return 'dromos-deed-part is-undone';
	return 'dromos-deed-part is-task';
}
