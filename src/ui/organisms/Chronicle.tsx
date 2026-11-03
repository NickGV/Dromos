import type { ChronicleView } from '../presenters/chronicleView';

/**
 * The chronicle of deeds on the home screen (game-ui S18): the section title, then the last deeds
 * of the ledger as journal lines, newest first, "Yesterday · Read 20 pages · Reader +10 XP". A deed
 * undone reads "Undone". Each part stays whole when a line wraps, and the dot before a part keeps
 * to the end of the line, never the start of the next.
 */
export function Chronicle({ view }: { readonly view: ChronicleView }) {
	return (
		<section className="dromos-section dromos-chronicle" aria-label={view.title}>
			<h2 className="dromos-card-title">{view.title}</h2>
			<div className="dromos-panel dromos-chronicle-panel">
				<ol className="dromos-deeds">
					{view.lines.map((line) => (
						<li key={line.key} className={line.undone ? 'dromos-deed is-undone' : 'dromos-deed'}>
							<span className="dromos-deed-day">{line.day}</span>
							{line.parts.map((part, index) => (
								<span key={index} className={partClass(index, line.parts.length, line.undone)}>
									{' · '}
									<span className="dromos-deed-text">{part}</span>
								</span>
							))}
						</li>
					))}
				</ol>
			</div>
		</section>
	);
}

/** The last part is what the deed gained; the first of an undone deed is the word "Undone". */
function partClass(index: number, count: number, undone: boolean): string {
	if (index === count - 1) return 'dromos-deed-part is-gain';
	if (undone && index === 0) return 'dromos-deed-part is-undone';
	return 'dromos-deed-part is-task';
}
