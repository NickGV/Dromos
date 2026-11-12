import type { ReactNode } from 'react';
import { SKILL_OBJECT_SPOTS, type ObjectSpot } from '../../presenters/avatar';

/** A skill's object and the spot it takes on the figure. */
export interface PlacedObject {
	readonly id: string;
	readonly spot: ObjectSpot;
}

/**
 * The objects of the skills the presenter chose, in its order, each with its spot. A skill with no
 * spot in `SKILL_OBJECT_SPOTS` draws nothing.
 */
export function placedObjects(ids: readonly string[]): readonly PlacedObject[] {
	return ids.flatMap((id) => {
		const spot = SKILL_OBJECT_SPOTS[id];
		return spot ? [{ id, spot }] : [];
	});
}

/** The olive wreath's nine leaves along its arch, high over the brow and lower at the temples, alternately tilted. */
const OLIVE_LEAVES = Array.from({ length: 9 }, (_, i) => {
	const t = i / 8;
	const x = -14 + 28 * t;
	const y = 6 - 9.6 * Math.sin(Math.PI * t);
	const slope = (Math.atan2(-9.6 * Math.PI * Math.cos(Math.PI * t), 28) * 180) / Math.PI;
	const tilt = slope + (i % 2 === 0 ? -34 : 34);
	return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${tilt.toFixed(1)})`;
});

/**
 * One object per skill (M11 L10), each drawn once around its own origin, about 12 units across, in
 * flat fills on the avatar's tokens; the anchors place and scale it on the bust and on the walker.
 */
const THINGS: Readonly<Record<string, ReactNode>> = {
	// The victor's wreath: a ring of olive leaves on a twig, an arch over the head.
	atleta: (
		<>
			<path className="dromos-avatar-twig dromos-avatar-fine" d="M-14.6 6.4Q0 -6.4 14.6 6.4" />
			{OLIVE_LEAVES.map((leaf) => (
				<ellipse key={leaf} className="dromos-avatar-olive" cx="0" cy="0" rx="2.9" ry="1.15" transform={leaf} />
			))}
		</>
	),
	// A round bronze shield: its rim, a ring and a boss.
	centinela: (
		<>
			<circle className="dromos-avatar-bronze" cx="0" cy="0" r="12" />
			<circle className="dromos-avatar-ring dromos-avatar-fine" cx="0" cy="0" r="8.4" />
			<circle className="dromos-avatar-boss" cx="0" cy="0" r="2.8" />
		</>
	),
	// An open wax tablet: two wooden leaves on a hinge, dark wax with lines scratched in it, a stylus.
	cronista: (
		<>
			<rect className="dromos-avatar-wood" x="-7.6" y="-5" width="7.2" height="10" rx="0.6" />
			<rect className="dromos-avatar-wood" x="0.4" y="-5" width="7.2" height="10" rx="0.6" />
			<rect className="dromos-avatar-wax" x="-6.4" y="-3.8" width="4.8" height="7.6" />
			<rect className="dromos-avatar-wax" x="1.6" y="-3.8" width="4.8" height="7.6" />
			<path className="dromos-avatar-scratch" d="M-5.6 -2H-2.4M-5.6 0H-2.6M-5.6 2H-3.4M2.4 -2H5.6M2.4 0H5" />
			<path className="dromos-avatar-stylus" d="M5.6 7.4L10.4 -3.4" />
		</>
	),
	// A round clay flask of oil on its cord, an ochre band, a sprig of green herbs tied to its neck.
	cuidador: (
		<>
			<path className="dromos-avatar-cord dromos-avatar-fine" d="M0 -9V-4.6" />
			<path className="dromos-avatar-olive" d="M0.6 -4.2C2.6 -7.4 5.4 -7.8 6.8 -6.6 5.8 -4.8 3.4 -3.8 0.6 -4.2Z" />
			<path className="dromos-avatar-olive" d="M-0.4 -4.4C-2.6 -7.2-5 -7.2-6 -5.8-4.8 -4.4-2.6 -3.8-0.4 -4.4Z" />
			<path className="dromos-avatar-clay" d="M-1.6 -4.8H1.6V-2.4C4.4 -1.4 6 0.8 6 3.4 6 6.8 3.4 8.8 0 8.8S-6 6.8-6 3.4C-6 0.8-4.4 -1.4-1.6 -2.4Z" />
			<path className="dromos-avatar-band" d="M-5.4 1.6Q0 3.4 5.4 1.6" />
			<rect className="dromos-avatar-clay" x="-2.4" y="-6" width="4.8" height="1.6" rx="0.6" />
		</>
	),
	// A bronze builder's square with its ticks.
	desarrollador: (
		<>
			<path className="dromos-avatar-bronze" d="M-5.4 -7.6H-2.2V3.6H7.4V6.8H-5.4Z" />
			<path className="dromos-avatar-tick dromos-avatar-fine" d="M-2.2 -4.6H-3.6M-2.2 -1.6H-3.6M-2.2 1.2H-3.6M0.8 3.6V5M3.8 3.6V5" />
		</>
	),
	// A writer's inkhorn at the waist (Ez 9:2): a bronze pot with its ink, a reed pen standing in it, on a cord.
	escriba: (
		<>
			<path className="dromos-avatar-cord dromos-avatar-fine" d="M-1.8 -2.6L-4.6 -8.6" />
			<path className="dromos-avatar-reed" d="M1.2 -1.6L5.6 -10.6" />
			<path className="dromos-avatar-nib" d="M5.6 -10.6L6.4 -12.2" />
			<path className="dromos-avatar-bronze" d="M-3.6 -1.6C-3.6 -2.8-2.8 -3.4-1.8 -3.4H1.8C2.8 -3.4 3.6 -2.8 3.6 -1.6V3.4C3.6 5.2 2 6.2 0 6.2S-3.6 5.2-3.6 3.4Z" />
			<ellipse className="dromos-avatar-ink" cx="0" cy="-2.6" rx="2.4" ry="0.8" />
			<path className="dromos-avatar-reed" d="M0.6 -2.4L1.2 -1.6" />
		</>
	),
	// An owl brooch pinning the mantle: ear tufts, two big eyes, a beak, in bronze.
	estudiante: (
		<>
			<path className="dromos-avatar-bronze" d="M-4.6 -3.4L-3.2 -6.4-1.2 -4.2H1.2L3.2 -6.4 4.6 -3.4C5.4 0.6 4.4 4.6 0 6 -4.4 4.6-5.4 0.6-4.6 -3.4Z" />
			<circle className="dromos-avatar-eyes" cx="-2" cy="-1.4" r="1.7" />
			<circle className="dromos-avatar-eyes" cx="2" cy="-1.4" r="1.7" />
			<circle className="dromos-avatar-ink" cx="-2" cy="-1.4" r="0.7" />
			<circle className="dromos-avatar-ink" cx="2" cy="-1.4" r="0.7" />
			<path className="dromos-avatar-beak" d="M-0.8 0.6H0.8L0 2.2Z" />
		</>
	),
	// The scroll of the Law: two rolls side by side on their wooden rods, knobs above and below.
	exegeta: (
		<>
			<path className="dromos-avatar-rod" d="M-3 -9.4V9.4M3 -9.4V9.4" />
			<rect className="dromos-avatar-paper" x="-5.6" y="-6" width="5.2" height="12" rx="1.4" />
			<rect className="dromos-avatar-paper" x="0.4" y="-6" width="5.2" height="12" rx="1.4" />
			<path className="dromos-avatar-tie" d="M-5.6 0H5.6" />
			<circle className="dromos-avatar-knob" cx="-3" cy="-9.4" r="1.3" />
			<circle className="dromos-avatar-knob" cx="3" cy="-9.4" r="1.3" />
			<circle className="dromos-avatar-knob" cx="-3" cy="9.4" r="1.3" />
			<circle className="dromos-avatar-knob" cx="3" cy="9.4" r="1.3" />
		</>
	),
	// A bronze hand mirror: a bright disk with a gleam, a short handle.
	labiolector: (
		<>
			<path className="dromos-avatar-wood" d="M-1 3V9.6C-1 10.4 1 10.4 1 9.6V3Z" />
			<circle className="dromos-avatar-bronze" cx="0" cy="-1.4" r="5.2" />
			<circle className="dromos-avatar-glass dromos-avatar-fine" cx="0" cy="-1.4" r="3.6" />
			<path className="dromos-avatar-gleam" d="M-2.4 -3.2Q-1.4 -4.4 0 -4.6" />
		</>
	),
	// A paper scroll with an ochre tie, its top standing out of the satchel.
	lector: (
		<>
			<rect className="dromos-avatar-paper" x="-2.2" y="-7" width="4.4" height="14" rx="1.6" />
			<ellipse className="dromos-avatar-paper" cx="0" cy="-7" rx="2.2" ry="0.9" />
			<path className="dromos-avatar-tie" d="M-2.2 -2.6H2.2" />
		</>
	),
	// The key of knowledge on a cord (Lk 11:52): its bow, a shaft and the bit, in iron.
	maestro: (
		<>
			<circle className="dromos-avatar-iron" cx="0" cy="-3.8" r="2.8" />
			<circle className="dromos-avatar-hole" cx="0" cy="-3.8" r="1" />
			<path className="dromos-avatar-iron" d="M-0.8 -1.2H0.8V6.2H3.4V8.4H0.8V9.6H-0.8Z" />
		</>
	),
	// A leather purse gathered by a cord, two coins at its mouth.
	mayordomo: (
		<>
			<circle className="dromos-avatar-coin" cx="-1.6" cy="-3.6" r="1.7" />
			<circle className="dromos-avatar-coin" cx="1.8" cy="-3.2" r="1.7" />
			<path className="dromos-avatar-leather" d="M-2.6 -2.4C-6 -0.4-6.2 4.8-3 6.6-1.2 7.4 1.2 7.4 3 6.6 6.2 4.8 6 -0.4 2.6 -2.4Z" />
			<path className="dromos-avatar-cord dromos-avatar-fine" d="M-2.8 -1.6Q0 -0.4 2.8 -1.6M-1.4 -1L-3.4 2.4" />
		</>
	),
	// Blue fringes on the mantle, to remember (Nm 15:39): two knots and their threads.
	mnemonista: (
		<>
			<path className="dromos-avatar-thread" d="M-3 -1V5.4M-3.8 -1L-4.8 5M-2.2 -1L-1.2 5M3 -1V5.4M2.2 -1L1.2 5M3.8 -1L4.8 5" />
			<circle className="dromos-avatar-knot" cx="-3" cy="-1.6" r="1.4" />
			<circle className="dromos-avatar-knot" cx="3" cy="-1.6" r="1.4" />
		</>
	),
	// A lunula: a gold crescent, its horns up.
	reposo: <path className="dromos-avatar-coin" d="M-5.4 -3C-5.4 2 -2.8 5.4 0 5.4S5.4 2 5.4 -3C3.8 0 2 1.2 0 1.2S-3.8 0-5.4 -3Z" />,
};

/** A skill's object, around its own origin, named by the skill; a skill without a drawing draws nothing. */
export function SkillObject({ id }: { readonly id: string }) {
	const drawing = THINGS[id];
	return drawing ? <g className={`dromos-avatar-thing is-${id}`}>{drawing}</g> : null;
}
