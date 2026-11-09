import type { ShownBookState } from '../presenters/libraryView';

/** A closed scroll lying on its side: the rod ends (umbilicus), the rolled papyrus and its edges. */
function ClosedScroll() {
	return (
		<>
			<rect className="dromos-scroll-knob" x="3" y="7" width="7" height="30" rx="2" />
			<rect className="dromos-scroll-knob" x="110" y="7" width="7" height="30" rx="2" />
			<rect className="dromos-scroll-paper" x="10" y="10" width="100" height="24" rx="3" />
			<path className="dromos-scroll-line" d="M12 15H108M12 29H108" />
		</>
	);
}

/** The cord tied round the middle, with its two loose ends. */
function Cord() {
	return (
		<>
			<rect className="dromos-scroll-cord" x="56" y="9" width="8" height="26" rx="1" />
			<path className="dromos-scroll-tail" d="M58 35c-2 4-6 6-10 5M62 35c2 4 6 6 10 5" />
		</>
	);
}

/** A scroll partly unrolled, as on the reading desk: a thick roll, the open sheet with its lines, a thin roll. */
function OpenScroll() {
	return (
		<>
			<rect className="dromos-scroll-paper" x="30" y="10" width="68" height="24" />
			<path className="dromos-scroll-text" d="M40 16H88M40 21H84M40 26H72" />
			<rect className="dromos-scroll-knob" x="3" y="4" width="7" height="36" rx="2" />
			<rect className="dromos-scroll-paper" x="10" y="6" width="24" height="32" rx="11" />
			<path className="dromos-scroll-spiral" d="M22 22a3 3 0 1 1 3 3" />
			<rect className="dromos-scroll-paper" x="96" y="9" width="14" height="26" rx="6" />
			<rect className="dromos-scroll-knob" x="110" y="7" width="7" height="30" rx="2" />
		</>
	);
}

/**
 * A scroll as the library draws each state (M7 S5, the design's specimen): pending is closed and
 * tied with a cord; reading is partly unrolled; paused is tied with a ribbon marking the page;
 * sealed carries the clay seal on its cord; a finished book missing its reflection is tied with an
 * empty seal outline. The state is always written beside it: this drawing alone never says it.
 */
export function ScrollArt({ state }: { readonly state: ShownBookState }) {
	return (
		<svg className={`dromos-scroll-art is-${state}`} viewBox="0 0 120 44" aria-hidden="true" focusable="false">
			{state === 'reading' ? (
				<OpenScroll />
			) : (
				<>
					<ClosedScroll />
					<Cord />
					{state === 'paused' ? <path className="dromos-scroll-ribbon" d="M86 33v10l3-2.5 3 2.5V33z" /> : null}
					{state === 'sealed' ? (
						<g className="dromos-scroll-seal">
							<circle cx="60" cy="22" r="7.5" />
							<circle className="dromos-scroll-seal-ring" cx="60" cy="22" r="4.5" />
						</g>
					) : null}
					{state === 'reflection-missing' ? <circle className="dromos-scroll-seal-empty" cx="60" cy="22" r="7.5" /> : null}
				</>
			)}
		</svg>
	);
}
