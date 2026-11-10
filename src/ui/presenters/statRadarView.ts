import type { StatId } from '../../domain';
import type { Translator } from '../../i18n';

/** A stat as the radar takes it: its names in the interface language and its value. */
export interface RadarStat {
	readonly id: StatId;
	/** "Strength". */
	readonly label: string;
	/** "STR". */
	readonly shortLabel: string;
	readonly value: number;
}

/** The scale's top while no stat passes it: the six pips the stats were drawn with before (game-ui S3). */
const SCALE_FLOOR = 6;

/** One ring every two points, so a ring means the same on every scale. */
const RING_STEP = 2;

/** One axis of the radar (S9): a stat, its tip's label and where its value sits. */
export interface StatRadarAxis {
	readonly id: StatId;
	/** "STR": the tip shows it with the value, "STR 3". */
	readonly shortLabel: string;
	/** "Strength". */
	readonly label: string;
	readonly value: number;
	/** "Strength 3": the tip's tooltip. */
	readonly text: string;
	/** The value against the scale's top: 0 at the centre, 1 on the outer ring. */
	readonly reach: number;
	/** The axis's direction from the centre, on a circle of radius 1 with y pointing down. */
	readonly x: number;
	readonly y: number;
}

/** What `StatRadar` draws (S9): the six stats as a hexagonal radar. */
export interface StatRadarView {
	/** The six stats in the order given, the first pointing up and the rest clockwise. */
	readonly axes: readonly StatRadarAxis[];
	/** The value of the outer ring: 6, or the highest stat rounded up to an even number once one passes 6. */
	readonly max: number;
	/** The value of each ring, inner first, one every two points up to `max`: [2, 4, 6]. */
	readonly rings: readonly number[];
	/** The chart's accessible name: "Strength 3, Vitality 2, …", all six. */
	readonly ariaLabel: string;
}

/**
 * Lays the stats out as a radar (S9). A stat of 0 sits at the centre, so a new character draws its
 * rings, axes and labels with its shape folded on the centre: that is the truth, so the chart fakes
 * no minimum. The scale stays at 6 until a stat passes it, then grows to the next even number.
 */
export function statRadarView(stats: readonly RadarStat[], t: Translator): StatRadarView {
	const highest = Math.max(0, ...stats.map((stat) => stat.value));
	const max = highest > SCALE_FLOOR ? Math.ceil(highest / RING_STEP) * RING_STEP : SCALE_FLOOR;
	const axes = stats.map((stat, index): StatRadarAxis => {
		const angle = -Math.PI / 2 + (index * 2 * Math.PI) / stats.length;
		return {
			id: stat.id,
			shortLabel: stat.shortLabel,
			label: stat.label,
			value: stat.value,
			text: t('character.stat.aria', { stat: stat.label, value: stat.value }),
			reach: stat.value / max,
			x: Math.cos(angle),
			y: Math.sin(angle),
		};
	});
	return {
		axes,
		max,
		rings: Array.from({ length: max / RING_STEP }, (_, index) => (index + 1) * RING_STEP),
		ariaLabel: axes.map((axis) => axis.text).join(', '),
	};
}
