import type { CSSProperties } from 'react';
import { GATE, GATE_TOP } from '../presenters/walkerView';

/**
 * The small board on the gate's lintel naming the next level, "Level 6" in small caps (game-ui
 * S16). It is text over the drawing rather than inside it, so it keeps its size and contrast at
 * every scene height; the stylesheet places it on the lintel from the gate's point in the view
 * box, passed here. A drawing: screen readers skip it, and the card says the next level in words.
 */
export function GatePlaque({ label }: { readonly label: string }) {
	const anchor = { '--dromos-gate-x': GATE.x, '--dromos-gate-top': GATE_TOP } as CSSProperties;
	return (
		<div className="dromos-gate-plaque" aria-hidden="true" style={anchor}>
			{label}
		</div>
	);
}
