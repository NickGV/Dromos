import { Ewe } from './FarLife';
import { LION, PASTURE_SHEEP, SHEPHERD } from './spots';

/*
 * The pasture of the landscape (home-header S7, S8): a shepherd among his sheep and a lion lying at
 * peace beside them, the lion and the lamb, on the far hill at the sheep's scale, in the scene's line
 * style. It is all life: the stylesheet holds it still under reduced motion, out of sight and
 * offline, in the pose it is drawn in here.
 */

/** The shepherd's sheep, then the shepherd, the lion and the lamb at its paws, back to front. */
export function Pasture() {
	const [grazing, lamb] = PASTURE_SHEEP;
	return (
		<g className="dromos-scene-pasture dromos-scene-life">
			{grazing ? <Ewe sheep={grazing} /> : null}
			<Shepherd />
			<Lion />
			{lamb ? <Ewe sheep={lamb} /> : null}
		</g>
	);
}

/**
 * The shepherd, facing the lion: a robe to the ground, a cloth over his head held by a band, a hand
 * on his crook. He leans on it, and now and then looks back at the sheep behind him.
 */
function Shepherd() {
	return (
		<g className="dromos-scene-shepherd" transform={`translate(${SHEPHERD.x} ${SHEPHERD.y})`}>
			<g className="dromos-scene-shepherd-lean">
				<path className="dromos-scene-crook" d="M6.4 0.2V-16.4C6.4 -19.6 9.8 -20 10 -17.6 10.1 -16.6 9.4 -16 8.7 -16.4" />
				<path className="dromos-scene-coat" d="M-2.6 -13.4C-1 -14.2 1.2 -14.2 2.6 -13.4L4.4 -0.2H-4.6z" />
				<path className="dromos-scene-fold" d="M-0.6 -12.4L-1.2 -0.8M1.6 -12.6L2.6 -5.6" />
				<path className="dromos-scene-coat" d="M0.8 -12.8C2.6 -11.8 4.4 -10.8 5.8 -10.4L5.4 -9C3.6 -9.4 1.8 -10.2 0.4 -11.2z" />
				<circle className="dromos-scene-skin" cx="6.4" cy="-9.8" r="1" />
				<g className="dromos-scene-shepherd-head">
					<circle className="dromos-scene-skin" cx="1" cy="-15.3" r="1.9" />
					<path className="dromos-scene-cloth" d="M-3 -12.2C-3.6 -15.8-2.4 -18 0.4 -18 2.4 -18 3.4 -17.2 3.3 -16.4 1.6 -16.6 0 -16.2-0.4 -15-0.7 -13.8-1 -12.6-1.6 -11.6z" />
					<path className="dromos-scene-fold" d="M-2.6 -16.6C-1 -17.2 1.4 -17.3 3.2 -16.8" />
					<circle className="dromos-scene-eye" cx="1.9" cy="-15.6" r="0.3" />
				</g>
			</g>
		</g>
	);
}

/**
 * The lion lying at peace beside the flock, facing it, its forepaws out before it and its tail on
 * the grass: a tawny body, a full darker mane, a tufted tail. Its tail's tip flicks now and then,
 * it breathes slowly, and every so often it lifts its head and settles it again.
 */
function Lion() {
	return (
		<g className="dromos-scene-lion" transform={`translate(${LION.x} ${LION.y})`}>
			<path className="dromos-scene-tail" d="M9.2 -1.6C11.4 -1 12.8 -1.2 13.6 -2.8" />
			<g className="dromos-scene-tail-tip">
				<path className="dromos-scene-tail" d="M13.6 -2.8C14.1 -3.9 13.9 -4.9 13.2 -5.5" />
				<ellipse className="dromos-scene-tail-tuft" cx="12.9" cy="-6.1" rx="1.15" ry="1.45" />
			</g>
			<g className="dromos-scene-lion-breath">
				<path className="dromos-scene-pelt" d="M-3.6 -6.8C0 -8.6 5.6 -8.8 8.4 -6 9.9 -4.5 10 -1.6 8.6 0H-3.4z" />
				<path className="dromos-scene-fold" d="M3.6 -0.2C2.8 -3.4 4.8 -5.8 7.8 -5.2" />
				<g className="dromos-scene-lion-head">
					<path
						className="dromos-scene-mane"
						d="M-3.3 -12Q-1.3 -12.9-1 -10.6Q1 -10.2 0.1 -8.2Q1.6 -6.6-0.2 -5.4Q0.3 -3.2-1.8 -3.3Q-2.5 -1.2-4.2 -2.4Q-5.9 -1-6.7 -3.1Q-8.8 -2.9-8.5 -5.1Q-10.4 -6.2-9 -7.8Q-10 -9.8-8 -10.4Q-7.9 -12.6-5.9 -11.9Q-4.6 -13.8-3.3 -12z"
					/>
					<path className="dromos-scene-pelt" d="M-6.8 -10.2C-7.4 -11.6-6 -12.4-5.2 -11.2z" />
					<path className="dromos-scene-pelt" d="M-5 -10.4C-7.2 -10.8-9.6 -10-10.2 -7.8-10.6 -6-9.6 -4.6-7.8 -4.6-6.4 -4.6-5.2 -5.4-4.8 -6.8z" />
					<circle className="dromos-scene-eye" cx="-7.9" cy="-8.3" r="0.45" />
					<path className="dromos-scene-eye" d="M-10.7 -7.9L-9.6 -8.2-9.8 -7z" />
					<path className="dromos-scene-fold" d="M-10 -6C-9.4 -5.5-8.6 -5.5-8.1 -6" />
				</g>
			</g>
			<path className="dromos-scene-pelt" d="M-2.8 -2.8H-9.6C-10.5 -2.8-10.6 -1.3-9.6 -1.3H-2.8z" />
			<path className="dromos-scene-pelt" d="M-2.4 -1.4H-10.6C-11.5 -1.4-11.6 0-10.6 0H-2.4z" />
		</g>
	);
}
