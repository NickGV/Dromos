/**
 * Where the campfire stands in the landscape's 960 × 300 view box: on the middle hill, left of
 * where the road comes out from under the card, clear of the walker's way, the gate, the plaque
 * and the signpost, and with its stones above the card's top on every scene height. Its flame
 * reaches 28.5 units up, which keeps it whole, flicker included, on the 170 px scene of the widest
 * panes, where the slice shows only the drawing's lowest 102 units.
 */
export const CAMPFIRE = { x: 486, y: 231 } as const;

/**
 * The campfire of a complete day (game-ui S17), in the scene's line style: a soft glow, a flame of
 * three tongues in clay and ochre, two crossed logs and a ring of stones. The stylesheet makes the
 * flame flicker and holds it still under reduced motion. Drawn inside the landscape, which screen
 * readers skip: the quest panel says "Day complete" in words.
 */
export function Campfire() {
	return (
		<g className="dromos-campfire" transform={`translate(${CAMPFIRE.x} ${CAMPFIRE.y})`}>
			<g className="dromos-campfire-glow">
				<ellipse cx="0" cy="-11" rx="24" ry="17" />
				<ellipse cx="0" cy="-9" rx="15" ry="11" />
			</g>
			<g className="dromos-campfire-flame">
				<path
					className="dromos-campfire-tongue is-outer"
					d="M-8 -3C-12 -9-9 -14-6.5 -17.5-6.5 -13.5-4.5 -12-3 -11.5-4.5 -18-1.5 -23 1 -28.5 2.5 -23 6.5 -19.5 5.5 -13 7.5 -14 8.5 -16.5 8.5 -18.5 11.5 -13 11 -7 7.5 -3z"
				/>
				<path className="dromos-campfire-tongue is-inner" d="M-4 -3C-6 -7.5-3.5 -11.5-1 -17 0.5 -12.5 3.5 -10.5 2.5 -6.5 3.5 -7.5 4.5 -9 4.5 -10 6.5 -7 5.5 -4.5 3.5 -3z" />
			</g>
			<path className="dromos-campfire-log" d="M-13 -0.5L11 -7.5" />
			<path className="dromos-campfire-log" d="M-11 -7.5L13 -0.5" />
			<g className="dromos-campfire-stones">
				<ellipse cx="-14.5" cy="0" rx="4.2" ry="2.8" />
				<ellipse cx="-5.5" cy="1.4" rx="4.4" ry="2.8" />
				<ellipse cx="4" cy="1.6" rx="4.4" ry="2.8" />
				<ellipse cx="13" cy="0.2" rx="4.2" ry="2.8" />
			</g>
		</g>
	);
}
