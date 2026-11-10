import { BUTTERFLIES, FIREFLIES, FLOWERS, TUFTS } from './spots';

/*
 * The near life of the landscape (home-header S4), along the road, in its line style. What moves
 * is marked `dromos-scene-life`, so the stylesheet holds it still under reduced motion, out of
 * sight and offline, in the pose it is drawn in here.
 */

/** Flowers dotting the near hill and the roadside, cream and ochre. They do not move. */
export function Flowers() {
	return (
		<g className="dromos-scene-flowers">
			{FLOWERS.map((flower) => (
				<circle key={`${flower.x},${flower.y}`} className={`dromos-scene-${flower.tone}`} cx={flower.x} cy={flower.y} r="1.8" />
			))}
		</g>
	);
}

/** Tufts of grass by the road, which the wind bends around their foot. */
export function Tufts() {
	return (
		<g className="dromos-scene-tufts dromos-scene-life">
			{TUFTS.map((tuft) => (
				<g key={`${tuft.x},${tuft.y}`} transform={`translate(${tuft.x} ${tuft.y})`}>
					<path className="dromos-scene-tuft" d="M-2 0L-4.6 -6.5M0 0L0.6 -9M2 0L4.6 -6" />
				</g>
			))}
		</g>
	);
}

/** Two butterflies resting on the flowers by day, slowly opening and closing their wings. */
export function Butterflies() {
	return (
		<g className="dromos-scene-butterflies dromos-scene-life">
			{BUTTERFLIES.map((butterfly) => (
				<g key={`${butterfly.x},${butterfly.y}`} transform={`translate(${butterfly.x} ${butterfly.y})`}>
					<path
						className="dromos-scene-wings"
						d="M0 -0.6C-1.2 -3.6-4.2 -5.6-5.1 -3.8-5.7 -2.4-3.4 -0.4 0 -0.6zM0 -0.6C1.2 -3.6 4.2 -5.6 5.1 -3.8 5.7 -2.4 3.4 -0.4 0 -0.6zM0 -0.2C-1.6 0.4-3.3 1.6-2.7 2.9-2.1 3.8-0.6 2.3 0 -0.2zM0 -0.2C1.6 0.4 3.3 1.6 2.7 2.9 2.1 3.8 0.6 2.3 0 -0.2z"
					/>
					<path className="dromos-scene-butterfly-body" d="M0 -2.4V2.4M-0.4 -2.4L-1.7 -4.8M0.4 -2.4L1.7 -4.8" />
				</g>
			))}
		</g>
	);
}

/** Fireflies drifting over the road at night, each glowing and fading on its own time. */
export function Fireflies() {
	return (
		<g className="dromos-scene-fireflies dromos-scene-life">
			{FIREFLIES.map((firefly) => (
				<g key={`${firefly.x},${firefly.y}`} transform={`translate(${firefly.x} ${firefly.y})`}>
					<g className="dromos-scene-firefly">
						<circle className="dromos-scene-firefly-glow" r="3.8" />
						<circle className="dromos-scene-firefly-spark" r="1.1" />
					</g>
				</g>
			))}
		</g>
	);
}
