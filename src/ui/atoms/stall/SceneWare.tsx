import { WareDrawing } from '../WareArt';
import type { WareObject } from '../../presenters/stallView';

export interface SceneWareProps {
	readonly object: WareObject;
	/** Where the ware's foot stands in the stall's drawing. */
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	/** Degrees it leans by, about its foot. */
	readonly turn?: number;
	readonly className?: string;
}

/**
 * A ware of the tiles set in the stall (M10 S6), on a shelf, the counter or a hook, so what the tiles
 * draw is what the stall holds. The drawing's foot, the point (32, 58) of its box, stands at (`x`, `y`).
 */
export function SceneWare({ object, x, y, scale, turn = 0, className }: SceneWareProps) {
	return (
		<g className={className} transform={`translate(${x} ${y}) rotate(${turn}) scale(${scale}) translate(-32 -58)`}>
			<WareDrawing object={object} />
		</g>
	);
}
