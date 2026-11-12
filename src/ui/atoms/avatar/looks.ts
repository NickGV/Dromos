import type { StageId } from '../../../domain/character/Stage';

/** The hair, from the young man's dark cap to the sage's white temples. */
export type Hair = 'young' | 'long' | 'combed' | 'neat' | 'temples' | 'thinning' | 'sage';
/** The beard, from the first down to the sage's long white one. */
export type Beard = 'down' | 'short' | 'trimmed' | 'full' | 'full-grey' | 'grey' | 'white';
/** What he wears over the tunic: the runner's hooded mantle, a wider patched cloak, the mantle tidied
 * or folded over a shoulder, the traveller's chlamys, the himation, a longer one with an ochre border,
 * and the sage's own. */
export type Garment = 'mantle' | 'cloak' | 'tidy' | 'folded' | 'chlamys' | 'himation' | 'himation-long' | 'sage';

/** How the figure looks at one stage: the parts the bust and the walker are drawn from. */
export interface StageLook {
	readonly hair: Hair;
	readonly beard: Beard | null;
	readonly garment: Garment;
	/** What his right hand holds on the bust: the staff while he travels, a scroll once he studies. */
	readonly hand: 'staff' | 'scroll';
	/** The staff: a plain one, then a thicker one with knots. */
	readonly staff: 'plain' | 'sturdy';
	/** A waterskin, its cord crossing the satchel's strap. */
	readonly waterskin?: boolean;
	/** Two dyed stripes down the tunic. */
	readonly clavi?: boolean;
	/** The traveller's wide felt hat. */
	readonly hat?: boolean;
	/** A case of scrolls in place of the satchel, and the tunic down to the ankles. */
	readonly capsa?: boolean;
	/** Creases of the brow, one or two with the years. */
	readonly creases?: 1 | 2;
	/** He walks a little bowed, so the staff stands taller than his head. */
	readonly stoop?: boolean;
}

/**
 * The twelve stages as the approved mockups draw them (M11 L10), from the runner of the road to the
 * sage: the same face throughout, the years in the hair, the beard and the clothes, the gear of the
 * road giving way to the scroll.
 */
export const STAGE_LOOKS: Readonly<Record<StageId, StageLook>> = {
	runner: { hair: 'young', beard: null, garment: 'mantle', hand: 'staff', staff: 'plain' },
	wayfarer: { hair: 'young', beard: null, garment: 'mantle', hand: 'staff', staff: 'plain', waterskin: true },
	pilgrim: { hair: 'long', beard: null, garment: 'cloak', hand: 'staff', staff: 'plain', waterskin: true },
	apprentice: { hair: 'combed', beard: null, garment: 'tidy', hand: 'staff', staff: 'plain', clavi: true },
	disciple: { hair: 'combed', beard: 'down', garment: 'folded', hand: 'staff', staff: 'plain', clavi: true },
	traveller: { hair: 'combed', beard: 'short', garment: 'chlamys', hand: 'staff', staff: 'sturdy', clavi: true, hat: true },
	student: { hair: 'neat', beard: 'short', garment: 'himation', hand: 'staff', staff: 'sturdy', clavi: true, capsa: true },
	scholar: { hair: 'neat', beard: 'trimmed', garment: 'himation', hand: 'scroll', staff: 'sturdy', clavi: true, capsa: true },
	mentor: { hair: 'neat', beard: 'full', garment: 'himation-long', hand: 'scroll', staff: 'sturdy', clavi: true, capsa: true, creases: 1 },
	counsellor: { hair: 'temples', beard: 'full-grey', garment: 'himation-long', hand: 'scroll', staff: 'sturdy', clavi: true, capsa: true, creases: 1 },
	elder: { hair: 'thinning', beard: 'grey', garment: 'himation-long', hand: 'scroll', staff: 'sturdy', clavi: true, capsa: true, creases: 2, stoop: true },
	sage: { hair: 'sage', beard: 'white', garment: 'sage', hand: 'scroll', staff: 'sturdy', capsa: true, creases: 2, stoop: true },
};

/** Whether the garment still hangs open over both shoulders, as the runner's mantle does. */
export function isOpenMantle(garment: Garment): boolean {
	return garment === 'mantle' || garment === 'tidy' || garment === 'cloak';
}

/** A computed coordinate, rounded to two decimals so the markup carries no float noise. */
export function n(value: number): number {
	return Math.round(value * 100) / 100;
}
