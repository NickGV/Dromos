import type { ReactElement } from 'react';
import type { WareObject } from '../presenters/stallView';

/*
 * The drawn wares of the stall (M10 S6), in the library's line: umber outlines on token fills, a
 * faint shadow under each. Habitica rewards carry no picture, so the stall draws each ware as one of
 * these, by its price (`wareObject`). Each is a drawing beside the ware's name: screen readers skip it.
 */

/** A woven basket heaped with figs, a fig leaf tucked at its side. */
function Figs() {
	return (
		<>
			<path className="dromos-ware-leaf" d="M44 31C48 22 56 20 60 23 56 25 57 29 53 30 55 33 51 35 47 34z" />
			<path className="dromos-ware-fine" d="M45 32C49 28 53 26 57 24" />
			<path className="dromos-ware-fig" d="M21 21C25 21 28 24 28 28 28 32 25 35 21 35 17 35 14 32 14 28 14 24 17 21 21 21z" />
			<path className="dromos-ware-fig" d="M43 21C47 21 50 24 50 28 50 32 47 35 43 35 39 35 36 32 36 28 36 24 39 21 43 21z" />
			<path className="dromos-ware-fig" d="M32 13C36 13 39 16 39 21 39 25 36 28 32 28 28 28 25 25 25 21 25 16 28 13 32 13z" />
			<path className="dromos-ware-fig" d="M32 22C36 22 39 25 39 29 39 33 36 36 32 36 28 36 25 33 25 29 25 25 28 22 32 22z" />
			<path className="dromos-ware-fine" d="M21 21L22 18M43 21L44 18M32 13L33 10M32 22L33 19" />
			<path className="dromos-ware-basket" d="M12 35H52L48 54C47.5 56 46 57 44 57H20C18 57 16.5 56 16 54z" />
			<rect className="dromos-ware-basket" x="10" y="32" width="44" height="5" rx="2.5" />
			<path className="dromos-ware-fine" d="M19 39L22 56M27 39L28.5 57M35 39L34.5 57M43 39L41 57M14.5 46H49.5" />
		</>
	);
}

/** The clay oil lamp of the ancient world: a round body, a nozzle with its small flame, a ring handle. */
function Lamp() {
	return (
		<g transform="translate(-3 12)">
			<path className="dromos-ware-flame" d="M61 30c-4-3-3.5-9 0-14 3.5 5 4 11 0 14z" />
			<path className="dromos-ware-handle" d="M14 28c-8-1-8-11-1-11 4 0 7 3 5 8" />
			<path className="dromos-ware-clay" d="M10 35c0-7 9-11 20-11 8 0 14 2 18 5l12 1.5c3 .5 3 5.5 0 6L48 38c-4 3-10 4.5-18 4.5C19 42.5 10 40.5 10 35z" />
			<path className="dromos-ware-handle" d="M17 30c8-3 20-3 28 0" />
			<circle className="dromos-ware-hole" cx="30" cy="27.5" r="2.2" />
		</g>
	);
}

/** One closed scroll tied with its cord, lying from `x` on the line `y`, `width` long. */
function TiedScroll({ x, y, width }: { readonly x: number; readonly y: number; readonly width: number }) {
	return (
		<g transform={`translate(${x} ${y})`}>
			<rect className="dromos-scroll-knob" x="-2.5" y="-1.5" width="4" height="14" rx="1.5" />
			<rect className="dromos-scroll-knob" x={width - 1.5} y="-1.5" width="4" height="14" rx="1.5" />
			<rect className="dromos-scroll-paper" x="1" y="0" width={width - 2} height="11" rx="3" />
			<path className="dromos-scroll-line" d={`M3 3H${width - 3}M3 8H${width - 3}`} />
			<rect className="dromos-scroll-cord" x={width / 2 - 2} y="-0.5" width="4" height="12" rx="0.5" />
		</g>
	);
}

/** Three scrolls tied with their cords, two lying and one on them, as the library keeps them. */
function Scrolls() {
	return (
		<>
			<TiedScroll x={7} y={44} width={24} />
			<TiedScroll x={33} y={44} width={24} />
			<TiedScroll x={14} y={31} width={36} />
			<path className="dromos-scroll-tail" d="M30 42c-2 3-5 4-8 4M34 42c2 3 5 4 8 4" />
		</>
	);
}

/** A tall amphora with its two handles and a painted band, standing on its knob foot. */
function Amphora() {
	return (
		<>
			<path className="dromos-ware-handle is-wide" d="M28 12C20 12 19 18 22 24M36 12C44 12 45 18 42 24" />
			<path className="dromos-ware-handle is-clay" d="M28 12C20 12 19 18 22 24M36 12C44 12 45 18 42 24" />
			<path className="dromos-ware-clay" d="M28 16C28 20 17 21 16.5 31 16 41 25 48 29.5 54L34.5 54C39 48 48 41 47.5 31 47 21 36 20 36 16z" />
			<rect className="dromos-ware-clay" x="28" y="9" width="8" height="8" />
			<rect className="dromos-ware-clay" x="26" y="6" width="12" height="4" rx="1.5" />
			<path className="dromos-ware-clay" d="M29.5 54L30.5 58H33.5L34.5 54" />
			<path className="dromos-ware-band" d="M18.5 29C27 31.5 37 31.5 45.5 29M17.5 34C27 36.5 37 36.5 46.5 34" />
		</>
	);
}

/** Folded lengths of purple cloth, an ochre woven border on each, the top one's end hanging with its fringe. */
function Cloth() {
	return (
		<>
			<rect className="dromos-ware-purple" x="7" y="44" width="50" height="12" rx="4.5" />
			<rect className="dromos-ware-purple" x="9" y="33" width="46" height="12" rx="4.5" />
			<rect className="dromos-ware-purple" x="11" y="22" width="42" height="12" rx="4.5" />
			<path className="dromos-ware-border" d="M17 22.5V33.5M15 33.5V44.5M13 44.5V55.5" />
			<path className="dromos-ware-purple" d="M36 27H47L49.5 50 43 53.5 37.5 50z" />
			<path className="dromos-ware-border" d="M36.9 44.5L48.8 43.8" />
			<path className="dromos-ware-fine" d="M40 51.2V56M43 52.6V57.4M46 51.8V56.6" />
		</>
	);
}

/** A small wooden chest with a domed lid, two bronze bands and its lock plate. */
function Chest() {
	return (
		<>
			<path className="dromos-ware-wood" d="M10 31V26C10 20 18 16.5 32 16.5S54 20 54 26V31z" />
			<rect className="dromos-ware-wood" x="10" y="31" width="44" height="23" rx="1.5" />
			<path className="dromos-ware-fine" d="M10 31H54M12 42.5H52" />
			<path className="dromos-ware-bronze" d="M17 18.6V54H21V17.5zM43 17.5V54H47V18.6z" />
			<rect className="dromos-ware-bronze" x="28" y="29" width="8" height="10" rx="1" />
			<path className="dromos-ware-keyhole" d="M32 32.4a1.3 1.3 0 1 0 .01 0zM31.4 33.6L31 36.6H33L32.6 33.6z" />
			<path className="dromos-ware-wood" d="M12 54V57H16V54M48 54V57H52V54" />
		</>
	);
}

const DRAWINGS: Record<WareObject, () => ReactElement> = { figs: Figs, lamp: Lamp, scroll: Scrolls, amphora: Amphora, cloth: Cloth, chest: Chest };

/** The drawing of one ware in its 64-unit box, its foot on the line y = 58: the stall sets the same wares on its shelves. */
export function WareDrawing({ object }: { readonly object: WareObject }) {
	const Drawing = DRAWINGS[object];
	return <Drawing />;
}

/** One ware's drawing, on a faint shadow; the stylesheet sizes it for a tile or for the detail panel. */
export function WareArt({ object }: { readonly object: WareObject }) {
	return (
		<svg className={`dromos-ware-art is-${object}`} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
			<ellipse className="dromos-ware-shadow" cx="32" cy="58" rx="24" ry="3.2" />
			<WareDrawing object={object} />
		</svg>
	);
}

/** The lock on a ware the gold cannot reach: a shackle over a small body with its keyhole. */
export function WareLock() {
	return (
		<svg className="dromos-ware-lock" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
			<path className="dromos-ware-lock-shackle" d="M5.6 8.5V6a3.4 3.4 0 0 1 6.8 0V8.5" />
			<rect className="dromos-ware-lock-body" x="3" y="8" width="12" height="8.5" rx="1.8" />
			<path className="dromos-ware-lock-hole" d="M9 10.6V13.6" />
		</svg>
	);
}
