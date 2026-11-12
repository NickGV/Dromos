/**
 * The character's twelve stages of life (M11 S1), in order, from the young runner of the road to the
 * sage. The figure on the plaque and the walker on the road are drawn at the stage the character has
 * reached; what each stage asks lives in the stage rules.
 */
export const STAGE_IDS = ['runner', 'wayfarer', 'pilgrim', 'apprentice', 'disciple', 'traveller', 'student', 'scholar', 'mentor', 'counsellor', 'elder', 'sage'] as const;

export type StageId = (typeof STAGE_IDS)[number];

/** The first stage: where every character starts. */
export const FIRST_STAGE: StageId = 'runner';
