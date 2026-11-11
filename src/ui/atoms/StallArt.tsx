import { useEffect, useId, useRef, useState } from 'react';
import { watchSight } from './landscape/sight';
import { Market } from './stall/Market';
import { Merchant } from './stall/Merchant';
import { SceneWare } from './stall/SceneWare';
import { LeftShelves, RightShelves } from './stall/Shelves';

/** The stripes of the awning, 40 units wide, across the drawing's 1000. */
const STRIPES = Array.from({ length: 25 }, (_, index) => index * 40);

/**
 * The front of the striped linen awning, cream and madder, each stripe ending in a scallop. Its hem
 * is a line across the top fold.
 */
function Awning() {
	return (
		<g className="dromos-stall-awning">
			{STRIPES.map((x, index) => (
				<path key={x} className={index % 2 === 0 ? 'dromos-stall-linen' : 'dromos-stall-dyed'} d={`M${x} 0H${x + 40}V44A20 13 0 0 1 ${x} 44z`} />
			))}
			<path className="dromos-stall-hem" d="M0 10H1000" />
		</g>
	);
}

/**
 * A clay oil lamp hanging from the awning on a cord split in two, swaying a little. Its flame and
 * flat halo are lit at night, and at dusk in the light theme.
 */
function HangingLamp({ x }: { readonly x: number }) {
	return (
		<g className="dromos-stall-hanging dromos-scene-life">
			<path className="dromos-stall-string" d={`M${x} 40V80M${x} 80L${x - 10} 92M${x} 80L${x + 10} 92`} />
			<circle className="dromos-stall-ring" cx={x} cy="80" r="2.2" />
			<ellipse className="dromos-stall-halo" cx={x + 18} cy="90" rx="15" ry="13" />
			<SceneWare object="lamp" x={x} y={107} scale={0.7} className="dromos-stall-flicker dromos-scene-life" />
		</g>
	);
}

/** The bronze balance on the counter, its beam level, a coin in one pan and a weight in the other. */
function Balance() {
	return (
		<g className="dromos-stall-balance" transform="translate(4 0)">
			<path className="dromos-stall-string" d="M300 170L291 204M300 170L309 204M360 170L351 204M360 170L369 204" />
			<path className="dromos-stall-bronze" d="M318 238H342L338 232H322z" />
			<rect className="dromos-stall-bronze" x="328" y="168" width="4" height="64" />
			<rect className="dromos-stall-bronze" x="297" y="166.5" width="66" height="3.5" rx="1.5" />
			<circle className="dromos-stall-bronze" cx="330" cy="164" r="3" />
			<path className="dromos-stall-bronze" d="M287 204H313C311 210 289 210 287 204z" />
			<path className="dromos-stall-bronze" d="M347 204H373C371 210 349 210 347 204z" />
			<ellipse className="dromos-stall-coin" cx="300" cy="203" rx="6" ry="2" />
			<rect className="dromos-stall-bronze" x="356" y="197" width="8" height="7" rx="1" />
		</g>
	);
}

/** Two stacks of gold coins and two loose ones, then the leather pouch they came from, tied at its neck. */
function Purse() {
	return (
		<>
			<g className="dromos-stall-coins">
				<ellipse cx="587" cy="240" rx="7" ry="2.4" />
				{[238, 234.5, 231, 227.5, 224].map((y) => (
					<ellipse key={y} cx="604" cy={y} rx="9" ry="3" />
				))}
				{[238, 234.5, 231].map((y) => (
					<ellipse key={y} cx="624" cy={y} rx="9" ry="3" />
				))}
				<ellipse cx="641" cy="240.5" rx="7" ry="2.4" />
			</g>
			<path className="dromos-stall-leather" d="M656 239C650 230 654 218 662 214H674C682 218 686 230 680 239z" />
			<path className="dromos-stall-tie" d="M660 214C664 210 672 210 676 214" />
			<path className="dromos-stall-string" d="M668 211L663 203M668 211L674 204" />
		</>
	);
}

/**
 * The stall of the Shop (M10 S6), seen from its counter as if the user stood in it: the market and
 * the sky of the hour behind, between two posts; the stall's shaded sides with their shelves of
 * wares; two clay lamps hanging from the awning; the merchant behind his counter, welcoming; the
 * balance, the gold and the pouch on the counter; and the striped linen awning
 * over it all. Every fill and stroke is a token, so the theme and the time of day (the stall's
 * `data-period`) repaint it as they repaint the landscape. Narrow panes slice its sides away and keep
 * the merchant. It lives in slow loops the stylesheet holds still under reduced motion, offline and
 * while it is out of sight. It is a drawing: screen readers skip it.
 */
export function StallArt() {
	// Unique per view, as the landscape's sky: two open Dromos tabs must not share one gradient.
	const sky = `dromos-stall-sky-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const { ref, still } = useStillOutOfSight();
	return (
		<svg ref={ref} className={still ? 'dromos-stall-art is-still' : 'dromos-stall-art'} viewBox="0 0 1000 272" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
					<stop className="dromos-scene-sky-top" offset="0" />
					<stop className="dromos-scene-sky-bottom" offset="1" />
				</linearGradient>
			</defs>
			<rect width="1000" height="246" fill={`url(#${sky})`} />
			<Market />
			<LeftShelves />
			<RightShelves />
			<rect className="dromos-stall-wood" x="224" y="30" width="14" height="206" />
			<rect className="dromos-stall-wood" x="762" y="30" width="14" height="206" />
			<HangingLamp x={316} />
			<HangingLamp x={684} />
			<Merchant x={500} y={236} scale={1.15} />
			<path className="dromos-stall-counter-front" d="M0 244H1000V280H0z" />
			<path className="dromos-stall-counter-top" d="M0 234H1000V244H0z" />
			<Balance />
			<Purse />
			<Awning />
		</svg>
	);
}

/**
 * The drawing's element and whether it is out of sight, so its loops hold still there, as the
 * landscape's do. It starts in sight, and stays so where there is no IntersectionObserver.
 */
function useStillOutOfSight() {
	const ref = useRef<SVGSVGElement>(null);
	const [still, setStill] = useState(false);
	useEffect(() => {
		const svg = ref.current;
		return svg ? watchSight(svg, (inSight) => setStill(!inSight)) : undefined;
	}, []);
	return { ref, still };
}
