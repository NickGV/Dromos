import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FAR_SCALE, GATE, GATE_SHAPE } from '../presenters/walkerView';
import { ChimneySmoke, Flock, Ridge, Sheep, Windmill } from './landscape/FarLife';
import { Butterflies, Fireflies, Flowers, Tufts } from './landscape/NearLife';
import { Pasture } from './landscape/Pasture';
import { watchSight } from './landscape/sight';

export interface LandscapeProps {
	/** Drawn last, over the road and in front of the gate: the campfire (game-ui S17) and the walker (S16). */
	readonly children?: ReactNode;
}

/**
 * The scene at the top of the view (game-ui S1), drawn after the user's design: a sky with a sun
 * and three drifting clouds, birds, cypresses, a tree and a village, three hills and the path,
 * with a gate at the path's far end (S16) and what it is given: the walker, and the campfire of a
 * complete day (S17). Every fill and stroke is a `--dromos-scene-*` token, so the dark theme turns
 * it into a night with stars, a moon, lit windows and a lamp, and the time of day repaints the
 * sky. It is a drawing: screen readers skip it.
 *
 * It lives (home-header S4): a far ridge, a windmill, sheep and chimney smoke, flowers, grass,
 * butterflies by day and fireflies at night, and a shepherd with his sheep and a lion at peace
 * beside them (S7, S8), with slow loops the stylesheet holds still under reduced motion, offline,
 * and while the scene is out of sight (the `is-still` class).
 */
export function Landscape({ children = null }: LandscapeProps) {
	// Unique per view: two open Dromos tabs must not share one gradient, since Chromium stops
	// painting a gradient whose element sits in a hidden tab.
	const sky = `dromos-sky-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const { ref, still } = useStillOutOfSight();
	return (
		<svg ref={ref} className={still ? 'dromos-landscape is-still' : 'dromos-landscape'} viewBox="0 0 960 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
			<defs>
				<linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
					<stop className="dromos-scene-sky-top" offset="0" />
					<stop className="dromos-scene-sky-bottom" offset="1" />
				</linearGradient>
			</defs>
			<rect width="960" height="300" fill={`url(#${sky})`} />
			{/* The sky's figures, in one group the stylesheet lowers on very wide panes. */}
			<g className="dromos-scene-sky">
				<g className="dromos-scene-stars dromos-scene-life">
					<circle cx="60" cy="40" r="1.3" />
					<circle cx="250" cy="22" r="1.1" />
					<circle cx="318" cy="98" r="1" />
					<circle cx="404" cy="30" r="1.4" />
					<circle cx="476" cy="108" r="1" />
					<circle cx="560" cy="38" r="1.2" />
					<circle cx="612" cy="92" r="1" />
					<circle cx="700" cy="112" r="1.1" />
					<circle cx="760" cy="26" r="1.4" />
					<circle cx="820" cy="62" r="1" />
					<circle cx="904" cy="30" r="1.2" />
				</g>
				{/* The time of day raises or lowers the sun (game-ui S17); at night it is the moon. */}
				<g className="dromos-scene-sun-height">
					<circle className="dromos-scene-sun" cx="150" cy="64" r="24" />
				</g>
				<g transform="translate(250 54)">
					<g className="dromos-scene-drift">
						<path className="dromos-scene-cloud" d="M0 22c-10 0-14-12-5-17 1-10 15-12 20-4 7-6 20-1 19 9 8 1 9 12-1 12z" />
					</g>
				</g>
				<g transform="translate(640 36)">
					<g className="dromos-scene-drift is-slow">
						<path className="dromos-scene-cloud" d="M0 24c-12 0-16-14-6-19 2-12 18-14 24-4 8-7 24-1 22 10 10 1 10 14-2 13z" />
					</g>
				</g>
				<g transform="translate(830 92)">
					<g className="dromos-scene-drift">
						<path className="dromos-scene-cloud" d="M0 18c-8 0-11-9-4-13 1-8 12-9 16-3 5-5 15-1 14 7 6 1 7 9-1 9z" />
					</g>
				</g>
				<Flock />
			</g>
			<Ridge />
			<path className="dromos-scene-hill is-far" d="M0 190C120 150 220 160 330 178S560 150 700 168 900 150 960 160V300H0z" />
			<Windmill />
			<Sheep />
			<Pasture />
			<g className="dromos-scene-village">
				<rect x="318" y="164" width="22" height="14" />
				<rect x="344" y="160" width="26" height="18" />
				<rect x="374" y="166" width="18" height="12" />
				<path className="dromos-scene-roof" d="M344 160l13-8 13 8" />
			</g>
			<ChimneySmoke />
			<g className="dromos-scene-windows">
				<rect x="327" y="169" width="4" height="4" />
				<rect x="355" y="167" width="4" height="5" />
				<rect x="381" y="170" width="4" height="4" />
			</g>
			<path className="dromos-scene-hill" d="M0 215C140 185 260 200 380 212S620 190 780 205 920 200 960 196V300H0z" />
			<path className="dromos-scene-patch" d="M380 212C470 224 560 214 640 198c-60-8-170-4-260 14z" />
			<g transform="translate(262 214)">
				<path className="dromos-scene-trunk" d="M0 0V-22" />
				<ellipse className="dromos-scene-crown" cx="0" cy="-30" rx="20" ry="13" />
			</g>
			<g className="dromos-scene-cypresses dromos-scene-life">
				<path className="dromos-scene-cypress" d="M112 206C101 186 103 150 112 124 121 150 123 186 112 206z" />
				<path className="dromos-scene-cypress" d="M142 211C133 194 135 164 142 142 149 164 151 194 142 211z" />
				<path className="dromos-scene-cypress" d="M700 216C689 196 691 160 700 134 709 160 711 196 700 216z" />
				<path className="dromos-scene-cypress" d="M731 217C722 200 724 170 731 150 738 170 740 200 731 217z" />
			</g>
			<path className="dromos-scene-hill" d="M0 255C200 235 360 250 520 246S800 236 960 250V300H0z" />
			<path className="dromos-scene-patch is-near" d="M0 276C260 262 600 284 960 270V300H0z" />
			<path className="dromos-scene-road" d="M410 300C450 272 508 266 514 248 520 234 556 226 600 214L612 216C575 228 556 240 562 250 568 266 522 286 522 300z" />
			<path className="dromos-scene-strokes" d="M60 270l3-8M66 271l1-6M72 270l-2-7M860 262l3-8M866 263l1-6M872 262l-2-7M300 280l3-8M306 281l1-6" />
			<Flowers />
			<Tufts />
			<Butterflies />
			<Fireflies />
			{/* The gate at the far end of the road, in the walker's units so it walks under the lintel (game-ui S16). */}
			<g className="dromos-scene-gate" transform={`translate(${GATE.x} ${GATE.y}) scale(${FAR_SCALE})`}>
				<path className="dromos-scene-gate-post" d={post(-GATE_SHAPE.postOuter, -GATE_SHAPE.postInner)} />
				<path className="dromos-scene-gate-post" d={post(GATE_SHAPE.postInner, GATE_SHAPE.postOuter)} />
				<path className="dromos-scene-gate-lintel" d={lintel()} />
			</g>
			{children}
		</svg>
	);
}

/**
 * The landscape's element and whether it is out of sight, so its loops hold still there. It starts
 * in sight, and stays so where there is no IntersectionObserver.
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

/** A post of the gate from `left` to `right`, standing on the ground at 0. */
function post(left: number, right: number): string {
	return `M${left} 0V${-GATE_SHAPE.height}H${right}V0z`;
}

/** The lintel across the posts' tops, a little wider than them. */
function lintel(): string {
	const top = -(GATE_SHAPE.height + GATE_SHAPE.lintelDepth);
	return `M${-GATE_SHAPE.lintelHalf} ${-GATE_SHAPE.height}V${top}H${GATE_SHAPE.lintelHalf}V${-GATE_SHAPE.height}z`;
}
