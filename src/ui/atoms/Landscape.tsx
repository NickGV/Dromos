/**
 * The header of the character card (S8): hills in three planes under a pale sky, clouds with an
 * outline, two cypresses and a robed figure seen from afar. Flat fills only, each one a
 * `--dromos-*` token, so the dark theme turns it into a night with stars and a lamp. It is a
 * drawing: screen readers skip it.
 */
export function Landscape() {
	return (
		<svg className="dromos-landscape" viewBox="0 0 960 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
			<rect className="dromos-landscape-sky" x="0" y="0" width="960" height="120" />
			<g className="dromos-landscape-stars">
				<circle cx="120" cy="22" r="1.4" />
				<circle cx="210" cy="46" r="1" />
				<circle cx="330" cy="16" r="1.2" />
				<circle cx="520" cy="30" r="1" />
				<circle cx="590" cy="12" r="1.4" />
				<circle cx="800" cy="40" r="1.1" />
				<circle cx="880" cy="18" r="1.3" />
			</g>
			<circle className="dromos-landscape-sun" cx="676" cy="40" r="14" />
			<path className="dromos-landscape-cloud" d="M300 42 q4 -12 18 -10 q8 -10 22 -4 q14 -2 16 10 q10 2 8 10 h-70 q-6 -4 6 -6 z" />
			<path className="dromos-landscape-cloud" d="M604 28 q4 -10 16 -8 q8 -9 20 -3 q12 -1 14 9 q8 2 6 8 h-60 q-5 -3 4 -6 z" />
			<path className="dromos-landscape-hill-far" d="M0 78 C140 52 300 60 430 74 C560 88 700 54 820 62 C880 66 930 72 960 70 L960 120 L0 120 Z" />
			<path className="dromos-landscape-hill-mid" d="M0 96 C160 76 320 84 480 92 C620 99 760 80 960 90 L960 120 L0 120 Z" />
			<path className="dromos-landscape-cypress" d="M600 93 C593 80 594 62 600 46 C606 62 607 80 600 93 Z" />
			<path className="dromos-landscape-cypress" d="M618 92 C613 83 614 70 618 60 C622 70 623 83 618 92 Z" />
			<path className="dromos-landscape-hill-near" d="M0 108 C200 97 400 101 560 106 C720 111 840 100 960 104 L960 120 L0 120 Z" />
			<g className="dromos-landscape-figure">
				<line className="dromos-landscape-staff" x1="449" y1="77" x2="451" y2="104" />
				<path className="dromos-landscape-robe" d="M436 104 L438.5 86 Q440 82 441.5 86 L444 104 Z" />
				<circle className="dromos-landscape-head" cx="440" cy="80.5" r="3" />
				<circle className="dromos-landscape-lamp" cx="451.5" cy="92" r="1.8" />
			</g>
		</svg>
	);
}
