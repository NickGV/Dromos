import type { WalkerArt } from '../../domain';
import { SKILL_OBJECT_SPOTS, type AvatarView } from './avatar';
import type { DayPeriod } from './dayPeriod';

/** The skills whose object can be painted (landscape-art S9): every skill that gives the figure one. */
export const PAINTED_OBJECT_IDS: readonly string[] = Object.keys(SKILL_OBJECT_SPOTS);

/** The walker as the user painted him: his stage's painting, and the painted objects among those he carries. */
export interface WalkerPaintingView {
	readonly src: string;
	/** By skill id; an object he carries without its painting is left out, and drawn. */
	readonly objects: Readonly<Record<string, string>>;
}

/**
 * The painted walker of the avatar's stage, or `null` for a stage without its painting, which keeps the
 * drawn walker with its drawn objects (S9's fallback, variant C over a painting).
 */
export function walkerArtView(art: WalkerArt, avatar: AvatarView): WalkerPaintingView | null {
	const src = art.stages[avatar.stage];
	if (src === undefined) return null;
	const objects: Record<string, string> = {};
	for (const id of avatar.objects) {
		const painting = Object.prototype.hasOwnProperty.call(art.objects, id) ? art.objects[id] : undefined;
		if (painting !== undefined) objects[id] = painting;
	}
	return { src, objects };
}

/**
 * How an hour's light is laid over the painted walker, as the pilot graded him offline: his saturation and
 * brightness, then a multiply by the light's colour (0-255) at `amount`, the rest of him as painted.
 */
export interface HourGrade {
	readonly color: readonly [number, number, number];
	readonly amount: number;
	readonly saturation: number;
	readonly brightness: number;
}

/** The light of each hour but the day's, in which he is shown as painted; the dark theme's is always the night's. */
export const HOUR_GRADES: Readonly<Record<Exclude<DayPeriod, 'day'>, HourGrade>> = {
	// A little pink and cool.
	dawn: { color: [255, 214, 222], amount: 0.55, saturation: 0.95, brightness: 1 },
	// Warm gold.
	dusk: { color: [255, 196, 140], amount: 0.6, saturation: 1.05, brightness: 0.98 },
	// Dim, cooler and less saturated.
	night: { color: [120, 138, 196], amount: 0.85, saturation: 0.7, brightness: 0.8 },
};

/** The luma weights of the grade's saturation, Pillow's (ITU-R 601). */
const LUMA = [0.299, 0.587, 0.114] as const;

/**
 * The grade folded into the 20 values of one `feColorMatrix` (sRGB): the saturation matrix, scaled by the
 * brightness, each row then by its channel's multiply, `1 - amount + amount * colour / 255`.
 */
export function gradeMatrix(grade: HourGrade): string {
	const rows = [0, 1, 2].map((row) => {
		const multiply = 1 - grade.amount + (grade.amount * grade.color[row]!) / 255;
		const cells = LUMA.map((weight, column) => multiply * grade.brightness * ((1 - grade.saturation) * weight + (row === column ? grade.saturation : 0)));
		return [...cells, 0, 0];
	});
	return [...rows.flat(), 0, 0, 0, 1, 0].map((value) => String(Number(value.toFixed(4)))).join(' ');
}
