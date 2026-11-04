import type { CeremonyPhase } from './levelUpView';

/** A point of the landscape's drawing, in the units of its 960 × 300 view box. */
export interface ScenePoint {
	readonly x: number;
	readonly y: number;
}

/** Where the walker's feet stand and how large it is drawn. */
export interface WalkerPlacement extends ScenePoint {
	readonly scale: number;
}

/**
 * Where the walk starts: at the bend where the road comes out from under the character card,
 * which overlaps the scene's foot. It is 6 units up the road from where the design stood the
 * walker, so its feet clear the card on the 220 px scene of narrow panes too.
 */
export const WALK_START: ScenePoint = { x: 539, y: 238 };

/** The foot of the gate, at the far end of the road (`M410 300C450 272 … 600 214L612 216…`). */
export const GATE: ScenePoint = { x: 606, y: 215 };

/** The walker's size at the gate, against 1 at the start: smaller with the distance. */
export const FAR_SCALE = 0.7;

/** The gate drawn in the walker's own units, so the walker fits under its lintel. */
export const GATE_SHAPE = { postOuter: 23, postInner: 17, height: 76, lintelHalf: 29, lintelDepth: 6 } as const;

/** The top of the gate's lintel in view-box units: the plaque with the next level sits on it. */
export const GATE_TOP = Math.round((GATE.y - (GATE_SHAPE.height + GATE_SHAPE.lintelDepth) * FAR_SCALE) * 100) / 100;

/** How long the walker takes to walk to its new place, as the bar fills beside it (game-ui S15, S16). */
export const WALK_MS = 1200;

/**
 * The walker's way along the middle of the road, a cubic from `WALK_START` to `GATE` that follows
 * the road's last bend: control points between its two edges.
 */
const WAY: readonly [ScenePoint, ScenePoint, ScenePoint, ScenePoint] = [WALK_START, { x: 543, y: 230 }, { x: 567, y: 222 }, GATE];

const SAMPLES = 64;

/** The way sampled at even steps of its parameter, with the length walked up to each sample. */
const TABLE: readonly { readonly point: ScenePoint; readonly length: number }[] = (() => {
	const rows: { point: ScenePoint; length: number }[] = [];
	for (let index = 0; index <= SAMPLES; index += 1) {
		const point = cubic(index / SAMPLES);
		const previous = rows[index - 1];
		rows.push({ point, length: previous ? previous.length + Math.hypot(point.x - previous.point.x, point.y - previous.point.y) : 0 });
	}
	return rows;
})();

/**
 * Where the walker stands at `fraction` of the level (game-ui S16): that share of the road's
 * length from the start, measured along it, so each XP moves it as far as the next. It shrinks
 * from 1 to `FAR_SCALE` on the way. A share outside 0..1 is clamped; one that is not a number is 0.
 */
export function walkerPlacement(fraction: number): WalkerPlacement {
	const share = Number.isFinite(fraction) ? Math.min(1, Math.max(0, fraction)) : 0;
	const scale = round(1 - (1 - FAR_SCALE) * share, 4);
	const total = TABLE[TABLE.length - 1]!.length;
	const target = share * total;
	let index = 1;
	while (index < TABLE.length - 1 && TABLE[index]!.length < target) index += 1;
	const before = TABLE[index - 1]!;
	const after = TABLE[index]!;
	const span = after.length - before.length;
	const along = span > 0 ? (target - before.length) / span : 0;
	return {
		x: round(before.point.x + (after.point.x - before.point.x) * along, 2),
		y: round(before.point.y + (after.point.y - before.point.y) * along, 2),
		scale,
	};
}

/** The SVG transform that stands the figure, drawn with its feet at its origin, at `placement`. */
export function walkerTransform(placement: WalkerPlacement): string {
	return `translate(${placement.x} ${placement.y}) scale(${placement.scale})`;
}

/** The share of the level done, XP into it over the XP it needs, inside 0..1; 0 when it needs none. */
export function levelFraction(xpIntoLevel: number, xpToNext: number): number {
	if (!(xpToNext > 0)) return 0;
	return Math.min(1, Math.max(0, xpIntoLevel / xpToNext));
}

/** The character as the walker reads it. */
export interface WalkerStanding {
	readonly level: number;
	readonly xpIntoLevel: number;
	readonly xpToNext: number;
}

/** Where the walker goes, as a share of the road, and the level the gate names. */
export interface WalkerScene {
	/** `null` without a character: the walker stands at the start. */
	readonly fraction: number | null;
	/** `null` without a character: the gate stands unmarked. */
	readonly gateLevel: number | null;
}

/**
 * The walker and the gate for the scene (game-ui S16). It stands at the share of the level done,
 * or at `held`, where the record of the last visit left it while the open sync runs (S15). While a
 * level-up ceremony fills the bar and lights the medallion, it walks to the gate of the level being
 * reached; once the ceremony shows its last step it stands on the new level, before the next gate.
 */
export function walkerView(standing: WalkerStanding | null, held: number | null, ceremony: { readonly level: number; readonly phase: CeremonyPhase } | null): WalkerScene {
	if (ceremony !== null && ceremony.phase !== 'final') return { fraction: 1, gateLevel: ceremony.level };
	if (standing === null) return { fraction: null, gateLevel: null };
	return { fraction: held ?? levelFraction(standing.xpIntoLevel, standing.xpToNext), gateLevel: standing.level + 1 };
}

function cubic(t: number): ScenePoint {
	const [p0, p1, p2, p3] = WAY;
	const u = 1 - t;
	const a = u * u * u;
	const b = 3 * u * u * t;
	const c = 3 * u * t * t;
	const d = t * t * t;
	return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y };
}

function round(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}
