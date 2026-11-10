import { SHEEP, WINDMILL } from './spots';

/*
 * The far life of the landscape (home-header S4), in its line style: flat token fills and the
 * scene's 1-unit line. What moves is marked `dromos-scene-life`, so the stylesheet holds it still
 * under reduced motion, out of sight and offline, in the pose it is drawn in here.
 */

/**
 * A low ridge of far mountains behind the far hill, for depth, in the sky's haze. It is lowest
 * where the sun is, since on wide panes the sky's figures come down towards it; the stylesheet
 * leaves it out where they have come all the way down.
 */
export function Ridge() {
	return (
		<path
			className="dromos-scene-ridge"
			d="M0 153.5C24 150.9 40 145.7 60 144.4 80 143.1 96 150.9 120 153.5 150 156.1 176 152.2 200 150.9 226 149.6 244 140.5 268 137.9 292 135.3 310 139.2 330 143.1 352 147 372 141.8 396 140.5 420 139.2 434 149.6 456 153.5 478 156.1 500 140.5 528 135.3 556 130.1 572 139.2 596 144.4 620 149.6 640 139.2 664 135.3 690 131.4 712 145.7 742 149.6 772 153.5 798 136.6 826 131.4 854 126.2 878 140.5 904 144.4 930 148.3 948 141.8 960 139.2V230H0z"
		/>
	);
}

/**
 * The two birds of the design, crossing the sky on a long loop with a slow wing beat. Still,
 * they keep the place the design gave them.
 */
export function Flock() {
	return (
		<g className="dromos-scene-flock dromos-scene-life">
			<g className="dromos-scene-glide">
				<path className="dromos-scene-birds" d="M420 70l5 4 5-4" />
				<path className="dromos-scene-birds" d="M440 58l4 3 4-3" />
			</g>
		</g>
	);
}

/** The four sails, an X at rest, turning about once every 24 s. */
const SAIL_ANGLES = [45, 135, 225, 315] as const;

/** A small windmill on the far hill, its tower and cap in the village's colors. */
export function Windmill() {
	return (
		<g className="dromos-scene-windmill dromos-scene-life" transform={`translate(${WINDMILL.x} ${WINDMILL.y})`}>
			<path className="dromos-scene-mill" d="M-6 0L-3.6 -19H3.6L6 0z" />
			<path className="dromos-scene-mill" d="M-4.8 -19L0 -24.5 4.8 -19z" />
			<path className="dromos-scene-mill-door" d="M-1.5 0V-4.5H1.5V0" />
			<g transform="translate(0 -20)">
				<g className="dromos-scene-sails">
					{SAIL_ANGLES.map((angle) => (
						<path key={angle} className="dromos-scene-sail" transform={`rotate(${angle})`} d="M0 0V-14M0.7 -13.6H3.9V-4.2H0.7z" />
					))}
					<circle className="dromos-scene-hub" r="1.4" />
				</g>
			</g>
		</g>
	);
}

/**
 * Three sheep on the far hill: one looks around, one grazes, and one lowers its head now and then.
 * The head turns about the neck, the bottom left corner of its box.
 */
export function Sheep() {
	return (
		<g className="dromos-scene-sheep dromos-scene-life">
			{SHEEP.map((sheep) => (
				<g key={sheep.x} className="dromos-scene-ewe" transform={`translate(${sheep.x} ${sheep.y})${sheep.facing === 'left' ? ' scale(-1 1)' : ''}`}>
					<path className="dromos-scene-legs" d="M-2.2 0V-2.8M2.1 0V-2.8" />
					<ellipse className="dromos-scene-wool" cx="0" cy="-4.8" rx="4.5" ry="2.9" />
					<g transform="translate(3.3 -5.6)">
						<g className={`dromos-scene-sheep-head is-${sheep.head}`}>
							<path d="M0 0L2 -1.2" />
							<ellipse cx="2.8" cy="-1.5" rx="1.8" ry="1.2" />
						</g>
					</g>
				</g>
			))}
		</g>
	);
}

/** The chimneys' tops, where the smoke comes from. */
const CHIMNEYS = [
	{ x: 335, y: 157.5, height: 6.5 },
	{ x: 386.8, y: 160.5, height: 5.5 },
] as const;

/** A chimney on two of the village's houses, and the smoke that rises from them in slow puffs. */
export function ChimneySmoke() {
	return (
		<>
			<g className="dromos-scene-chimneys">
				{CHIMNEYS.map((chimney) => (
					<rect key={chimney.x} x={chimney.x - 2} y={chimney.y} width="4" height={chimney.height} />
				))}
			</g>
			<g className="dromos-scene-smoke dromos-scene-life">
				{CHIMNEYS.map((chimney) => (
					<g key={chimney.x} transform={`translate(${chimney.x} ${chimney.y - 2.5})`}>
						<circle r="2.3" />
						<circle r="2.3" />
						<circle r="2.3" />
					</g>
				))}
			</g>
		</>
	);
}
