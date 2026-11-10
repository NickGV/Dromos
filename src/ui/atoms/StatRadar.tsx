import type { StatRadarView } from '../presenters/statRadarView';

/** The outer ring's radius, in the drawing's units (pixels on the plaque). */
const RADIUS = 32;
/** The room for a side label beyond its tip: "STR 3" in the plaque's 11 px small caps (about 27 px). */
const LABEL_ROOM = 30;
/** Between a tip and its label: across for the side labels, up or down for the top and bottom ones. */
const SIDE_GAP = 4;
const END_GAP = 2;
/** The height of the labels' capitals at 11 px, which centres a side label on its tip. */
const CAP = 8;

const WIDTH = 2 * (Math.round(RADIUS * Math.cos(Math.PI / 6)) + SIDE_GAP + LABEL_ROOM);
const HEIGHT = 2 * (RADIUS + END_GAP + CAP);
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

/** A coordinate to two decimals, so the markup stays short. */
const at = (value: number): number => Math.round(value * 100) / 100;

/** The point at `reach` (0 the centre, 1 the outer ring) along a direction. */
const pointAt = (x: number, y: number, reach: number): readonly [number, number] => [at(CX + RADIUS * reach * x), at(CY + RADIUS * reach * y)];

const pointsOf = (points: readonly (readonly [number, number])[]): string => points.map(([x, y]) => `${x},${y}`).join(' ');

export interface StatRadarProps {
	readonly view: StatRadarView;
}

/**
 * The six stats as a hexagonal radar (S9): a hexagon ring every two points and the six axes in a
 * quiet umber hairline, the values joined in an ochre shape with a dot on each axis, and each tip
 * labelled by its short label and its number, "STR 3". The chart is one image named by all six
 * stats; each tip keeps the full name and the value as its tooltip.
 */
export function StatRadar({ view }: StatRadarProps) {
	const { axes, max, rings } = view;
	return (
		<svg className="dromos-radar" role="img" aria-label={view.ariaLabel} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
			{rings.map((ring) => (
				<polygon key={ring} className="dromos-radar-ring" points={pointsOf(axes.map((axis) => pointAt(axis.x, axis.y, ring / max)))} />
			))}
			{axes.map((axis) => {
				const [x2, y2] = pointAt(axis.x, axis.y, 1);
				return <line key={axis.id} className="dromos-radar-axis" x1={at(CX)} y1={at(CY)} x2={x2} y2={y2} />;
			})}
			<polygon className="dromos-radar-shape" points={pointsOf(axes.map((axis) => pointAt(axis.x, axis.y, axis.reach)))} />
			{axes.map((axis) => {
				const [cx, cy] = pointAt(axis.x, axis.y, axis.reach);
				return (
					<g key={axis.id} className="dromos-radar-tip">
						<title>{axis.text}</title>
						<circle className="dromos-radar-dot" cx={cx} cy={cy} r={3} />
						<TipLabel x={axis.x} y={axis.y} shortLabel={axis.shortLabel} value={axis.value} />
					</g>
				);
			})}
		</svg>
	);
}

/**
 * A tip's label: centred above the top tip and below the bottom one, beside the others, reading
 * away from the chart.
 */
function TipLabel({ x, y, shortLabel, value }: { readonly x: number; readonly y: number; readonly shortLabel: string; readonly value: number }) {
	const [tipX, tipY] = pointAt(x, y, 1);
	const side = Math.abs(x) > 0.01;
	const anchor = !side ? 'middle' : x > 0 ? 'start' : 'end';
	const labelX = !side ? tipX : tipX + Math.sign(x) * SIDE_GAP;
	const labelY = side ? tipY + CAP / 2 : y < 0 ? tipY - END_GAP : tipY + END_GAP + CAP;
	return (
		<text className="dromos-radar-text" x={at(labelX)} y={at(labelY)} textAnchor={anchor}>
			<tspan className="dromos-radar-label">{shortLabel}</tspan> <tspan className="dromos-radar-value">{value}</tspan>
		</text>
	);
}
