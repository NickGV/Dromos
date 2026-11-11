import { SceneWare as Ware } from './SceneWare';

/*
 * The two sides of the stall (M10 S6): boarded walls in the shade of the awning, with wooden shelves
 * holding the very wares the tiles draw, scrolls, oil jars, purple cloth, baskets of figs and dates,
 * a clay lamp set out, a small chest, and amphorae leaning on the wall or standing in their rack. The
 * stylesheet outlines them in the scene's line, so they sit in the same light as the market.
 */

/** A round oil jar with a narrow neck and its lip, standing at (`x`, `y`). */
function Jar({ x, y, size }: { readonly x: number; readonly y: number; readonly size: number }) {
	return (
		<g transform={`translate(${x} ${y}) scale(${size})`}>
			<path className="dromos-stall-clay" d="M-8 0C-15-2-17-10-14-16-12-20-8-22-4-23V-28H4V-23C8-22 12-20 14-16 17-10 15-2 8 0z" />
			<rect className="dromos-stall-clay" x="-6" y="-31" width="12" height="4" rx="1.5" />
			<path className="dromos-stall-band" d="M-14.6-12C-5-9.6 5-9.6 14.6-12" />
		</g>
	);
}

function Plank({ x, y, width }: { readonly x: number; readonly y: number; readonly width: number }) {
	return (
		<g className="dromos-stall-wood">
			<rect x={x} y={y} width={width} height="7" rx="1.5" />
			<path d={`M${x + 14} ${y + 7}V${y + 19}L${x + 26} ${y + 7}zM${x + width - 14} ${y + 7}V${y + 19}L${x + width - 26} ${y + 7}z`} />
		</g>
	);
}

/** The left side: scrolls, two oil jars and purple cloth above; figs, dates and a lamp below; two amphorae leaning on the wall. */
export function LeftShelves() {
	return (
		<g className="dromos-stall-side">
			<path className="dromos-stall-inside" d="M0 0H226V240H0z" />
			<path className="dromos-stall-boards" d="M28 0V240M56 0V240M84 0V240M112 0V240M140 0V240M168 0V240M196 0V240" />
			<Ware object="amphora" x={46} y={262} scale={1.55} turn={-9} />
			<Ware object="amphora" x={104} y={266} scale={1.45} turn={7} />
			<Plank x={8} y={112} width={212} />
			<Ware object="scroll" x={48} y={112} scale={0.95} />
			<Jar x={118} y={112} size={0.95} />
			<Jar x={144} y={112} size={0.7} />
			<Ware object="cloth" x={190} y={112} scale={0.78} />
			<Plank x={8} y={178} width={212} />
			<Ware object="figs" x={44} y={178} scale={0.92} />
			<Ware object="figs" x={106} y={178} scale={0.88} className="is-dates" />
			<g className="dromos-stall-lamp-set">
				<ellipse className="dromos-stall-halo" cx="189" cy="164" rx="12" ry="10" />
				<Ware object="lamp" x={172} y={178} scale={0.62} className="dromos-stall-flicker dromos-scene-life" />
			</g>
		</g>
	);
}

/** The right side: three oil jars and the small chest on the shelf; three amphorae standing in their rack below. */
export function RightShelves() {
	return (
		<g className="dromos-stall-side">
			<path className="dromos-stall-inside" d="M774 0H1000V240H774z" />
			<path className="dromos-stall-boards" d="M802 0V240M830 0V240M858 0V240M886 0V240M914 0V240M942 0V240M970 0V240" />
			<Plank x={780} y={150} width={214} />
			<Jar x={804} y={150} size={1} />
			<Jar x={834} y={150} size={0.8} />
			<Jar x={860} y={150} size={0.9} />
			<Ware object="chest" x={924} y={150} scale={0.9} />
			<Ware object="amphora" x={812} y={256} scale={1.4} />
			<Ware object="amphora" x={866} y={256} scale={1.4} />
			<Ware object="amphora" x={920} y={256} scale={1.4} />
			<rect className="dromos-stall-wood" x="780" y="214" width="214" height="6" rx="1.5" />
		</g>
	);
}
