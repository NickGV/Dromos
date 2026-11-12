import type { ObjectSpot } from '../../presenters/avatar';
import type { Garment, StageLook } from './looks';

/** The bust's layers an object can be drawn in, from behind him to in front of him. */
export type BustLayer = 'behind' | 'staff' | 'understrap' | 'body' | 'pendant' | 'head' | 'hand' | 'front';
/** The walker's layers an object can be drawn in, from behind him to in front of him. */
export type WalkerLayer = 'behind' | 'staff' | 'body' | 'satchel' | 'arm' | 'head' | 'front';

/** The layer each spot is drawn in on the bust. */
export const BUST_LAYER: Readonly<Record<ObjectSpot, BustLayer>> = { back: 'behind', staff: 'staff', head: 'head', clasp: 'front', neck: 'pendant', strap: 'body', satchel: 'understrap', belt: 'body', hand: 'hand', hem: 'body' };
/** The layer each spot is drawn in on the walker. */
export const WALKER_LAYER: Readonly<Record<ObjectSpot, WalkerLayer>> = { back: 'behind', staff: 'staff', head: 'head', clasp: 'front', neck: 'front', strap: 'body', satchel: 'satchel', belt: 'body', hand: 'arm', hem: 'body' };

/** How low a pendant hangs on the bust: lower as the beard grows long, at most to 88. */
const BUST_NECK: Partial<Record<NonNullable<StageLook['beard']>, number>> = { full: 72, 'full-grey': 72, grey: 82, white: 88 };

/** Where a pendant hangs on the bust, under the chin or over the beard. */
export function bustNeckY(look: StageLook): number {
	return (look.beard ? BUST_NECK[look.beard] : undefined) ?? 79.4;
}

/** Whether the head is bald on top, so the wreath sits lower. */
const bald = (look: StageLook): boolean => look.hair === 'sage' || look.hair === 'thinning';

/**
 * Where a spot sits on the bust, in its 100-unit box at the objects' own size. A spot moves a little
 * with the stage: the hat lifts the wreath, the scroll in his right hand moves the straps and the
 * belt, the beard lowers the pendant.
 */
export function bustAnchor(look: StageLook, spot: ObjectSpot): string {
	const scroll = look.hand === 'scroll';
	switch (spot) {
		case 'head':
			return look.hat ? 'translate(50 24.4) scale(0.84 0.7)' : `translate(50 ${bald(look) ? 28.6 : 26}) scale(1.02 1)`;
		case 'back':
			return 'translate(25.4 62)';
		case 'staff':
			return scroll ? 'translate(19.4 36.6)' : 'translate(22 36.6)';
		case 'clasp':
			return look.garment === 'chlamys' ? 'translate(35.8 78.8)' : scroll ? 'translate(30.4 76.6)' : 'translate(33.6 77.6)';
		case 'neck':
			return `translate(50 ${bustNeckY(look)})`;
		case 'strap':
			return scroll ? 'translate(58.6 80.4) rotate(-12)' : 'translate(55.4 82) rotate(-12)';
		case 'satchel':
			return scroll ? 'translate(50.4 87.6) rotate(-42)' : 'translate(45.6 89.4) rotate(-42)';
		case 'belt':
			return scroll ? 'translate(55.8 89.6) rotate(-8)' : 'translate(35 84.4) rotate(8)';
		case 'hand':
			return 'translate(74 48.6)';
		case 'hem':
			return 'translate(63.2 75.2)';
	}
}

/** Where the blue fringes hang on the walker: the open mantle's hem behind him, or the himation's in front. */
const WALKER_HEM: Readonly<Record<Garment, readonly [number, number]>> = {
	mantle: [-13.2, -22.4],
	tidy: [-13.2, -22.4],
	cloak: [-15, -18.6],
	folded: [-13.2, -24.2],
	chlamys: [-14.4, -15.6],
	himation: [11.6, -14.2],
	'himation-long': [11.6, -10.4],
	sage: [11.6, -8],
};

/** Where a pendant hangs on the walker, over the beard as it grows. */
const WALKER_NECK: Partial<Record<NonNullable<StageLook['beard']>, readonly [number, number]>> = {
	full: [6.6, -45.6],
	'full-grey': [6.6, -45.6],
	grey: [7, -42.4],
	white: [7.4, -39.4],
};

/**
 * Where a spot sits on the walker, in its units, feet at the origin. The objects are drawn there at
 * half size or less, so they keep their size against the head; their lines are doubled in the
 * stylesheet to keep the walker's outline.
 */
export function walkerAnchor(look: StageLook, spot: ObjectSpot): string {
	switch (spot) {
		case 'head':
			return look.hat ? 'translate(1 -63.6) rotate(4) scale(0.36 0.3)' : `translate(0.4 ${bald(look) ? -60.6 : -61.4}) rotate(14) scale(0.5)`;
		case 'back':
			return 'translate(-11.4 -40.6) scale(0.32 0.5)';
		case 'staff':
			return 'translate(20 -49.6) scale(0.5)';
		case 'clasp':
			return look.hand === 'scroll' || look.capsa ? 'translate(-3.6 -47.4) scale(0.36)' : 'translate(4.4 -48.4) scale(0.36)';
		case 'neck': {
			const [x, y] = (look.beard ? WALKER_NECK[look.beard] : undefined) ?? [6.6, -46.4];
			return `translate(${x} ${y}) scale(0.36)`;
		}
		case 'strap':
			return 'translate(-1.4 -45.2) rotate(-20) scale(0.5)';
		case 'satchel':
			return look.capsa ? 'translate(8.2 -35.6) rotate(10) scale(0.5)' : 'translate(9 -32.4) rotate(22) scale(0.5)';
		case 'belt':
			return look.capsa ? 'translate(8.2 -14.6) scale(0.5)' : 'translate(8.6 -15.8) scale(0.5)';
		case 'hand':
			return 'translate(9.8 -41.4) rotate(-14) scale(0.5)';
		case 'hem': {
			const [x, y] = WALKER_HEM[look.garment];
			return `translate(${x} ${y}) scale(0.5)`;
		}
	}
}
