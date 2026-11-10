/**
 * Where the life of the landscape stands (home-header S4), in the 960 × 300 view box: each spot
 * is the foot of what is drawn there. All of it keeps clear of the walker's way and figure, the
 * gate and its plaque, and the campfire, and none of it sits in the lower right, where the
 * signpost is planted. The left of the drawing is under the character plaque on wide panes, so
 * most of the life is between the village and the cypresses, where every pane shows it.
 */
export interface Spot {
	readonly x: number;
	readonly y: number;
}

/**
 * The windmill on the far hill, at the village's edge: phones frame the drawing from x 427 at
 * 360 px, so it is whole or out of the frame there rather than cut in two.
 */
export const WINDMILL: Spot = { x: 412, y: 184 };

export interface SheepSpot extends Spot {
	/** Which way it looks. */
	readonly facing: 'left' | 'right';
	/** `up` looks around, `down` grazes, `grazing` lowers its head now and then. */
	readonly head: 'up' | 'down' | 'grazing';
}

/** Three sheep on the far hill, between the gate and the cypresses. */
export const SHEEP: readonly SheepSpot[] = [
	{ x: 650, y: 184, facing: 'right', head: 'up' },
	{ x: 664, y: 189, facing: 'right', head: 'grazing' },
	{ x: 679, y: 182, facing: 'left', head: 'down' },
];

export interface FlowerSpot extends Spot {
	/** Cream or ochre. */
	readonly tone: 'flower' | 'bloom';
}

/** Flowers dotting the near hill and both sides of the road, in small clusters. */
export const FLOWERS: readonly FlowerSpot[] = [
	{ x: 318, y: 270, tone: 'bloom' },
	{ x: 324, y: 265, tone: 'flower' },
	{ x: 330, y: 272, tone: 'flower' },
	{ x: 377, y: 294, tone: 'bloom' },
	{ x: 384, y: 288, tone: 'flower' },
	{ x: 390, y: 283, tone: 'bloom' },
	{ x: 396, y: 290, tone: 'flower' },
	{ x: 438, y: 266, tone: 'flower' },
	{ x: 444, y: 261, tone: 'bloom' },
	{ x: 450, y: 268, tone: 'flower' },
	{ x: 566, y: 276, tone: 'bloom' },
	{ x: 573, y: 270, tone: 'flower' },
	{ x: 580, y: 278, tone: 'flower' },
	{ x: 588, y: 272, tone: 'bloom' },
	{ x: 628, y: 258, tone: 'flower' },
	{ x: 635, y: 254, tone: 'bloom' },
	{ x: 641, y: 261, tone: 'flower' },
	{ x: 652, y: 226, tone: 'flower' },
	{ x: 659, y: 230, tone: 'bloom' },
];

/** Tufts of grass along the road, which the wind bends. */
export const TUFTS: readonly Spot[] = [
	{ x: 372, y: 293 },
	{ x: 421, y: 279 },
	{ x: 553, y: 292 },
	{ x: 606, y: 281 },
	{ x: 667, y: 266 },
];

/** Two butterflies resting on the flowers, by day. */
export const BUTTERFLIES: readonly Spot[] = [
	{ x: 447, y: 256 },
	{ x: 584, y: 266 },
];

/** Fireflies over the road at night. */
export const FIREFLIES: readonly Spot[] = [
	{ x: 446, y: 274 },
	{ x: 466, y: 255 },
	{ x: 592, y: 268 },
	{ x: 634, y: 256 },
	{ x: 662, y: 240 },
];
