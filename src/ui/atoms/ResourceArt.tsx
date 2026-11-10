import type { ReactNode } from 'react';
import type { ResourceKind, ResourceState } from '../../domain';

/** What a resource's drawing carries over its object: nothing, the empty seal outline, or the clay seal. */
export type ResourceMark = 'none' | 'empty' | 'sealed';

/** The mark of each state (M8 S5): a pending resource is the object plain. */
export function resourceMark(state: ResourceState): ResourceMark {
	if (state === 'processed') return 'sealed';
	return state === 'takeaway-missing' ? 'empty' : 'none';
}

/** One small object per kind (08-Visual-Design, "El archivo"), on a 40-unit square; `none` is "Sin tipo". */
const OBJECTS: Readonly<Record<ResourceKind | 'none', ReactNode>> = {
	// A folded papyrus letter.
	post: (
		<>
			<rect className="dromos-resource-paper" x="5" y="10" width="28" height="19" rx="1.5" />
			<path className="dromos-resource-line" d="M5.5 11L19 21.5L32.5 11M5.5 28.5L15 19.5M32.5 28.5L23 19.5" />
		</>
	),
	// A few sheets held by a cord, with a small stamp on it.
	paper: (
		<>
			<rect className="dromos-resource-paper" x="11" y="5" width="20" height="26" rx="1" />
			<rect className="dromos-resource-paper" x="7" y="9" width="20" height="26" rx="1" />
			<path className="dromos-resource-text" d="M11 14H23M11 18H23M11 22H19" />
			<rect className="dromos-resource-cord" x="5.5" y="26" width="23" height="2.6" />
			<circle className="dromos-resource-stamp" cx="11" cy="27.3" r="2.8" />
		</>
	),
	// A small painted wooden panel with a triangle mark.
	video: (
		<>
			<rect className="dromos-resource-wood" x="4" y="8" width="32" height="24" rx="1.5" />
			<rect className="dromos-resource-paper" x="8" y="12" width="24" height="16" rx="0.5" />
			<path className="dromos-resource-play" d="M17 15.5L25 20L17 24.5Z" />
		</>
	),
	// A small lyre: two horns on a sound box, a yoke across, three strings.
	podcast: (
		<>
			<path className="dromos-resource-horn" d="M13 27C8 21 7 13 10 6M27 27C32 21 33 13 30 6M9.5 11H30.5" />
			<path className="dromos-resource-string" d="M16 11V27M20 11V27M24 11V27" />
			<path className="dromos-resource-wood" d="M10 27H30L28.5 33A2 2 0 0 1 26.5 34.5H13.5A2 2 0 0 1 11.5 33Z" />
		</>
	),
	// A wax tablet with its stylus.
	tool: (
		<>
			<rect className="dromos-resource-wood" x="5" y="10" width="24" height="22" rx="1.5" />
			<rect className="dromos-resource-wax" x="8.5" y="13.5" width="17" height="15" rx="0.5" />
			<path className="dromos-resource-text" d="M11 18H21M11 22H18" />
			<path className="dromos-resource-stylus" d="M21 31L35 7" />
		</>
	),
	// A stack of wax tablets tied together.
	course: (
		<>
			<rect className="dromos-resource-wood" x="7" y="9" width="26" height="7" rx="1.5" />
			<rect className="dromos-resource-wood" x="7" y="17" width="26" height="7" rx="1.5" />
			<rect className="dromos-resource-wood" x="7" y="25" width="26" height="7" rx="1.5" />
			<rect className="dromos-resource-cord" x="18.5" y="7.5" width="3" height="26" />
		</>
	),
	// "Sin tipo": a plain sheet with a folded corner.
	none: (
		<>
			<path className="dromos-resource-paper" d="M10 6H24L30 12V34H10Z" />
			<path className="dromos-resource-line" d="M24 6V12H30" />
		</>
	),
};

/**
 * The small drawn object of a resource's kind (M8 S5): a folded letter, sheets on a cord, a painted
 * panel, a lyre, a wax tablet, tied tablets, or a plain sheet for "Sin tipo". A processed resource
 * carries the clay seal, one missing what it left the empty seal outline. Always drawn beside the
 * words that say the kind and the state, so it is decoration; every color comes from a token.
 */
export function ResourceArt({ kind, mark = 'none' }: { readonly kind: ResourceKind | null; readonly mark?: ResourceMark }) {
	const className = mark === 'none' ? `dromos-resource-art is-${kind ?? 'none'}` : `dromos-resource-art is-${kind ?? 'none'} has-${mark}-seal`;
	return (
		<svg className={className} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
			{OBJECTS[kind ?? 'none']}
			{mark === 'sealed' ? (
				<g className="dromos-resource-seal">
					<circle cx="31" cy="31" r="6.5" />
					<circle className="dromos-resource-seal-ring" cx="31" cy="31" r="4" />
				</g>
			) : null}
			{mark === 'empty' ? <circle className="dromos-resource-seal-empty" cx="31" cy="31" r="6.5" /> : null}
		</svg>
	);
}
