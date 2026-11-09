/** Where the tied scrolls lie in a niche, filled in order: three on the plank, two on them, one on top. */
const SCROLL_SLOTS: readonly { readonly x: number; readonly y: number }[] = [
	{ x: 23, y: 91 },
	{ x: 62, y: 91 },
	{ x: 101, y: 91 },
	{ x: 42, y: 78 },
	{ x: 81, y: 78 },
	{ x: 62, y: 65 },
];

/** Where the rolled scrolls stand up out of the capsa, filled in order. */
const CAPSA_SLOTS: readonly number[] = [80, 70, 90, 62, 98];

/** A small closed scroll, tied with its cord, 36 units long. */
function TiedScroll({ x, y }: { readonly x: number; readonly y: number }) {
	return (
		<g className="dromos-alcove-scroll" transform={`translate(${x} ${y})`}>
			<rect className="dromos-scroll-knob" x="-2" y="0" width="3" height="13" rx="1" />
			<rect className="dromos-scroll-knob" x="35" y="0" width="3" height="13" rx="1" />
			<rect className="dromos-scroll-paper" x="1" y="1" width="34" height="11" rx="2" />
			<rect className="dromos-scroll-cord" x="16" y="0.5" width="4" height="12" />
		</g>
	);
}

/**
 * The capsa, the round box ancient libraries kept loose scrolls in, standing on the niche's floor
 * with `scrolls` rolls showing at its mouth, a strap round it. It holds the books with no shelf.
 */
function Capsa({ scrolls }: { readonly scrolls: number }) {
	return (
		<g className="dromos-capsa">
			{/* The mouth's dark inside first, then the rolls, then the box's front, which hides their feet. */}
			<ellipse className="dromos-capsa-mouth" cx="80" cy="74" rx="23" ry="5" />
			{CAPSA_SLOTS.slice(0, scrolls).map((x) => (
				<g key={x} className="dromos-capsa-roll">
					<rect className="dromos-scroll-paper" x={x - 3.5} y="56" width="7" height="22" rx="3.5" />
					<ellipse className="dromos-scroll-knob" cx={x} cy="56" rx="3.5" ry="1.6" />
				</g>
			))}
			<path className="dromos-capsa-body" d="M57 74A23 5 0 0 0 103 74V106A23 5 0 0 1 57 106Z" />
			<path className="dromos-capsa-strap" d="M57 85A23 5 0 0 0 103 85M57 97A23 5 0 0 0 103 97" />
		</g>
	);
}

/**
 * One alcove of the library wall (M7 S6, "Ilustraciones de M7"): a stone niche with a soft shadow
 * under its arch and a few joints of the wall around it, and inside it either a plank with up to
 * six tied scrolls, as a hint of the shelf (never its titles), or the capsa of the books with no
 * shelf. With no scrolls it is a bare niche, as the empty library draws it.
 */
export function AlcoveArt({ scrolls, capsa }: { readonly scrolls: number; readonly capsa: boolean }) {
	return (
		<svg className={capsa ? 'dromos-alcove-art is-capsa' : 'dromos-alcove-art'} viewBox="0 0 160 120" aria-hidden="true" focusable="false">
			<path className="dromos-alcove-joints" d="M2 22H12M4 48H12M2 78H12M3 104H12M148 18H158M148 52H157M148 84H158M148 108H156" />
			<path className="dromos-alcove-niche" d="M16 117V58A64 46 0 0 1 144 58V117Z" />
			<path className="dromos-alcove-shade" d="M16 58A64 46 0 0 1 144 58V68A64 42 0 0 0 16 68Z" />
			{capsa ? (
				<>
					<path className="dromos-alcove-floor" d="M16 111H144" />
					{scrolls > 0 ? <Capsa scrolls={scrolls} /> : null}
				</>
			) : (
				<>
					{SCROLL_SLOTS.slice(0, scrolls).map((slot) => (
						<TiedScroll key={`${slot.x}-${slot.y}`} x={slot.x} y={slot.y} />
					))}
					<rect className="dromos-alcove-plank" x="11" y="104" width="138" height="7" rx="1" />
				</>
			)}
		</svg>
	);
}
