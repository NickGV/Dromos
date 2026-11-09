import { useId } from 'react';

/** An id unique to this drawing in the window, so two open views never share a pattern. */
function useArtId(name: string): string {
	return `dromos-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
}

/**
 * The back wall of the reading room (M7 S6): courses of dressed stone drawn as thin joints, and by
 * day a band of warm afternoon light falling in from an opening; the stylesheet takes it away at
 * night. Drawn at the wall's real size, so the stones keep their size on any pane.
 */
export function WallArt() {
	const stones = useArtId('stones');
	return (
		<>
			<svg className="dromos-wall-art" aria-hidden="true" focusable="false">
				<defs>
					<pattern id={stones} patternUnits="userSpaceOnUse" width="112" height="48">
						<path className="dromos-wall-joint" d="M0 24H112M0 48H112M56 0V24M0 24V48M112 24V48" />
					</pattern>
				</defs>
				<rect width="100%" height="100%" fill={`url(#${stones})`} />
			</svg>
			<span className="dromos-wall-light" />
		</>
	);
}

/**
 * What stands on the reading desk (M7 S6): an ink pot with its quill and, at night only, the clay
 * oil lamp of the ancient world (a round body, a nozzle with its small flame, a ring handle), with a
 * flat warm halo and no glow.
 */
export function DeskArt() {
	return (
		<>
			<svg className="dromos-library-lamp" viewBox="0 0 72 48" aria-hidden="true" focusable="false">
				<ellipse className="dromos-library-lamp-halo" cx="61" cy="19" rx="11" ry="10" />
				<path className="dromos-library-lamp-flame" d="M61 30c-4-3-3.5-9 0-14 3.5 5 4 11 0 14z" />
				<path className="dromos-library-lamp-handle" d="M14 28c-8-1-8-11-1-11 4 0 7 3 5 8" />
				<path className="dromos-library-lamp-body" d="M10 35c0-7 9-11 20-11 8 0 14 2 18 5l12 1.5c3 .5 3 5.5 0 6L48 38c-4 3-10 4.5-18 4.5C19 42.5 10 40.5 10 35z" />
				<path className="dromos-library-lamp-handle" d="M17 30c8-3 20-3 28 0M22 44h16" />
				<circle className="dromos-library-lamp-hole" cx="30" cy="27.5" r="2.2" />
			</svg>
			<svg className="dromos-library-inkwell" viewBox="0 0 48 56" aria-hidden="true" focusable="false">
				<path className="dromos-library-quill" d="M22 41L44 3c-11 4-20 16-23 33z" />
				<path className="dromos-library-quill-shaft" d="M21 44L39 12" />
				<path className="dromos-library-ink" d="M10 54h24v-11a4 4 0 0 0-4-4H14a4 4 0 0 0-4 4z" />
				<rect className="dromos-library-ink" x="15" y="35" width="14" height="4" rx="1" />
			</svg>
		</>
	);
}

/**
 * The alcove seen up close, as one shelf shows it (M7 S6): the soft shadow under the arch, drawn
 * across the shelf's width; the stylesheet rounds the shelf's top into the arch itself.
 */
export function ShelfArt() {
	return (
		<svg className="dromos-shelf-arch" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden="true" focusable="false">
			<path className="dromos-shelf-arch-shade" d="M0 40C0 12 70 3 200 3S400 12 400 40V30C400 20 330 12 200 12S0 20 0 30z" />
		</svg>
	);
}

/** One rod of the unrolled scroll (the umbilicus), with its knobs at both ends, drawn by the stylesheet. */
export function Umbilicus({ side }: { readonly side: 'left' | 'right' }) {
	return <span className={`dromos-umbilicus is-${side}`} />;
}
