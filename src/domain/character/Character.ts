/** The six stats of ADR-014, in the display order of the `Character.md` schema. */
export const STAT_IDS = ['fuerza', 'vitalidad', 'inteligencia', 'sabiduria', 'espiritu', 'disciplina'] as const;
export type StatId = (typeof STAT_IDS)[number];

export interface Character {
	readonly name: string;
	readonly title: string;
	readonly level: number;
	readonly totalXp: number;
	readonly xpIntoLevel: number;
	readonly xpToNext: number;
	readonly stats: Readonly<Record<StatId, number>>;
}
