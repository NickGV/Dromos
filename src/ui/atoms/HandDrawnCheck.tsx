/** The design's hand-drawn circle, and the check drawn into it (game-ui S6, S8). */
const CIRCLE = 'M13 2.5c5.8-.3 10.6 4.4 10.4 10.4-.2 5.9-4.8 10.5-10.6 10.3C7 23 2.4 18.4 2.6 12.9 2.8 7 7.4 2.7 13 2.5z';
const TICK = 'M8 13.5l3.5 3.5L18.5 9';

/** The circle of a quest or a campaign task, checked once completed. A drawing: the row says the state in words. */
export function HandDrawnCheck({ completed }: { readonly completed: boolean }) {
	return (
		<svg className="dromos-quest-mark" viewBox="0 0 26 26" width="28" height="28" aria-hidden="true" focusable="false">
			<path className="dromos-quest-circle" d={CIRCLE} />
			{completed ? <path className="dromos-quest-tick" d={TICK} strokeDasharray="22" /> : null}
		</svg>
	);
}
