import { describe, expect, it } from 'vitest';
import type { StageStanding } from '../../src/application';
import { countedEvidence, DEFAULT_STAGE_RULES, LATER_STAGE_IDS, stageFor, stageProgress, type LaterStageId, type StageEvidence } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import type { AvatarView } from '../../src/ui/presenters/avatar';
import { portraitButtonLabel, stageCardView } from '../../src/ui/presenters/stageCardView';

const es = createTranslator('es');
const en = createTranslator('en');
const TODAY = '2026-11-12';

/** `count` earned skills, the first ones raised to the ranks given as `[rank, how many]`; the others hold the first rank. */
function earned(count: number, ...raised: readonly (readonly [number, number])[]): StageEvidence['earned'] {
	const skills: { rankIndex: number | null }[] = Array.from({ length: count }, () => ({ rankIndex: 0 }));
	let next = 0;
	for (const [rank, many] of raised) {
		for (let index = 0; index < many; index += 1) skills[next++] = { rankIndex: rank - 1 };
	}
	return skills;
}

interface Moment {
	readonly evidence: Partial<StageEvidence>;
	readonly totalXp: number;
	readonly gameStart: string | null;
	readonly xpLeft?: Partial<Record<LaterStageId, number>>;
}

/** A standing as `LoadAvatar.read` gives it, by the default table, with 14 skills in the vault. */
function standing({ evidence, totalXp, gameStart, xpLeft = {} }: Moment): StageStanding {
	const counted = countedEvidence({ totalSkills: 14, ...evidence });
	return {
		stage: stageFor(counted),
		evidence: counted,
		steps: LATER_STAGE_IDS.map((stage) => ({ stage, requirements: stageProgress(counted, DEFAULT_STAGE_RULES[stage]), xpLeft: xpLeft[stage] ?? 0 })),
		totalXp,
		gameStart,
	};
}

/** The user today: the runner at level 2, 11 days on the road, two books finished. */
const TODAY_MOMENT: Moment = { evidence: { level: 2, days: 11, books: 2 }, totalXp: 135, gameStart: '2026-11-01', xpLeft: { wayfarer: 248, pilgrim: 1568 } };
/** Mid-road: the traveller at level 12, five skills, one of them at rank 2. */
const MID_MOMENT: Moment = { evidence: { level: 12, days: 640, earned: earned(5, [2, 1]), campaigns: 2, books: 7 }, totalXp: 19716, gameStart: '2025-02-10', xpLeft: { student: 2357 } };
/** The end of the road: the sage. */
const LAST_MOMENT: Moment = { evidence: { level: 30, days: 4812, earned: earned(14, [4, 8], [3, 3], [2, 3]), campaigns: 12, books: 52 }, totalXp: 195029, gameStart: '2013-08-01' };

const AVATAR: AvatarView = { stage: 'runner', objects: ['lector'] };
const card = (moment: Moment, t = es) => stageCardView(standing(moment), AVATAR, 'Nicolás', TODAY, t);
const rows = (moment: Moment, t = es) => card(moment, t).next.rows;
const row = (moment: Moment, id: string, t = es) => rows(moment, t).find((candidate) => candidate.id === id);

describe('stageCardView: the head of the card (stage-card S1)', () => {
	it('names the dialog after the character, and the stage reached by its number and its name', () => {
		expect(card(TODAY_MOMENT)).toMatchObject({ ariaLabel: 'Las etapas de Nicolás', kicker: 'Etapa 1 de 12', title: 'Corredor' });
		expect(card(MID_MOMENT)).toMatchObject({ kicker: 'Etapa 6 de 12', title: 'Viajero' });
	});

	it('says since when the character is on the road and how many days, the year only when it is another', () => {
		expect(card(TODAY_MOMENT).since).toBe('En el camino desde el 1 de noviembre · 11 días');
		expect(card(MID_MOMENT).since).toBe('En el camino desde el 10 de febrero de 2025 · 640 días');
		expect(card({ ...TODAY_MOMENT, evidence: { ...TODAY_MOMENT.evidence, days: 1 } }).since).toBe('En el camino desde el 1 de noviembre · 1 día');
	});

	it('before the first game sync there is no game_start: no day on the road yet', () => {
		expect(card({ ...TODAY_MOMENT, gameStart: null, evidence: { level: 1 } }).since).toBe('Aún sin días en el camino');
	});

	it('draws the big bust at the stage reached, carrying the objects of the figure', () => {
		expect(card(MID_MOMENT).avatar).toEqual({ stage: 'traveller', objects: ['lector'] });
	});
});

describe('stageCardView: what the next stage asks (stage-card S1)', () => {
	it('names the next stage', () => {
		expect(card(TODAY_MOMENT).next).toMatchObject({ kind: 'next', before: 'Para ser ', name: 'Caminante' });
		expect(card(MID_MOMENT).next).toMatchObject({ kind: 'next', name: 'Estudioso' });
	});

	it('leaves out a requirement the next stage does not ask', () => {
		expect(rows(TODAY_MOMENT).map(({ id }) => id)).toEqual(['level', 'days']);
		expect(rows(MID_MOMENT).map(({ id }) => id)).toEqual(['level', 'skills', 'campaigns']);
	});

	it('the level: what is missing, with the XP still needed, and a bar of the XP towards it', () => {
		expect(row(TODAY_MOMENT, 'level')).toEqual({ id: 'level', label: 'Nivel 3', count: 'nivel 2 de 3', met: false, percent: 35, hint: 'Te faltan 248 XP' });
		expect(row(MID_MOMENT, 'level')).toMatchObject({ label: 'Nivel 13', count: 'nivel 12 de 13', percent: 89, hint: 'Te faltan 2357 XP' });
	});

	it('a level two or more away still fills its bar by XP, not by levels done over levels needed', () => {
		const pilgrim: Moment = { evidence: { level: 5, days: 40, earned: earned(1) }, totalXp: 1800, gameStart: '2026-09-01', xpLeft: { apprentice: 2200 } };

		// 5 of 7 levels would be 71 %; 1800 of the 4000 XP level 7 asks is 45 %.
		expect(row(pilgrim, 'level')).toMatchObject({ count: 'nivel 5 de 7', percent: 45, hint: 'Te faltan 2200 XP' });
	});

	it('the days: what is missing, and the day they are met', () => {
		expect(row(TODAY_MOMENT, 'days')).toEqual({ id: 'days', label: '30 días en el camino', count: '11 de 30 días', met: false, percent: 37, hint: 'Faltan 19 días: el 1 de diciembre' });
		expect(row({ ...TODAY_MOMENT, evidence: { level: 2, days: 29 } }, 'days')?.hint).toBe('Falta 1 día: el 1 de diciembre');
	});

	it('without game_start the days say what is missing, with no day', () => {
		expect(row({ ...TODAY_MOMENT, gameStart: null, evidence: { level: 2 } }, 'days')?.hint).toBe('Faltan 30 días');
	});

	it('a met requirement is ticked with its plain value, never "8 de 7", and has no bar nor hint', () => {
		expect(row(MID_MOMENT, 'skills')).toEqual({ id: 'skills', label: '5 skills ganadas', count: '5 skills', met: true, percent: null, hint: null });
		expect(rows(LAST_MOMENT)).toEqual([
			{ id: 'level', label: 'Nivel 30', count: 'nivel 30', met: true, percent: null, hint: null },
			{ id: 'skills', label: 'Todas las skills (14)', count: '14 skills', met: true, percent: null, hint: null },
			{ id: 'skillsAtRank', label: 'La mitad en rango 4 (7)', count: '8 en rango 4', met: true, percent: null, hint: null },
			{ id: 'books', label: '50 libros terminados', count: '52 libros', met: true, percent: null, hint: null },
		]);
	});

	it('counts skills, skills at a rank, campaigns and books as "N de M" while missing, each bar their share', () => {
		const disciple: Moment = { evidence: { level: 10, days: 300, earned: earned(3), campaigns: 1, books: 6 }, totalXp: 6000, gameStart: '2026-01-15', xpLeft: { traveller: 900 } };

		expect(rows(disciple).slice(1)).toEqual([
			{ id: 'skills', label: '4 skills ganadas', count: '3 de 4 skills', met: false, percent: 75, hint: null },
			{ id: 'skillsAtRank', label: '1 skill en rango 2', count: '0 de 1 en rango 2', met: false, percent: 0, hint: null },
		]);
		expect(row(MID_MOMENT, 'campaigns')).toEqual({ id: 'campaigns', label: '3 campañas terminadas', count: '2 de 3 campañas', met: false, percent: 67, hint: null });
	});

	it('words each label in the singular for one and in the plural for more', () => {
		const pilgrim: Moment = { evidence: { level: 6, days: 40 }, totalXp: 2000, gameStart: '2026-09-01' };
		const apprentice: Moment = { evidence: { level: 7, days: 40, earned: earned(1) }, totalXp: 3000, gameStart: '2026-09-01' };

		expect(row(pilgrim, 'skills')?.label).toBe('1 skill ganada');
		expect(row(apprentice, 'campaigns')?.label).toBe('1 campaña terminada');
		expect(row({ ...MID_MOMENT, evidence: { ...MID_MOMENT.evidence, earned: earned(5, [2, 1]) } }, 'skills')?.label).toBe('5 skills ganadas');
	});
});

describe('stageCardView: the end of the road (stage-card S1)', () => {
	it('has no next stage: the road is complete, and the last stage’s requirements show, all met', () => {
		const end = card(LAST_MOMENT);

		expect(end.next).toMatchObject({ kind: 'complete', title: 'El camino está completo', note: 'Sabio es la última etapa. Esto es lo que pide, y lo sigues cumpliendo:' });
		expect(end.next.rows.every(({ met }) => met)).toBe(true);
		expect(end.road.map(({ state }) => state)).toEqual([...Array<string>(11).fill('passed'), 'current']);
	});
});

describe('stageCardView: the road of twelve stages (stage-card S1)', () => {
	it('marks the passed ones, the current one, the next one and the ones ahead, each with its numeral and name', () => {
		const road = card(MID_MOMENT).road;

		expect(road.map(({ numeral, name, state }) => `${numeral} ${name} ${state}`)).toEqual([
			'I Corredor passed',
			'II Caminante passed',
			'III Peregrino passed',
			'IV Aprendiz passed',
			'V Discípulo passed',
			'VI Viajero current',
			'VII Estudioso next',
			'VIII Erudito ahead',
			'IX Mentor ahead',
			'X Consejero ahead',
			'XI Anciano ahead',
			'XII Sabio ahead',
		]);
	});

	it('tags the current and the next stage, and says every state for screen readers', () => {
		const road = card(MID_MOMENT).road;

		expect(road.map(({ tag }) => tag)).toEqual([null, null, null, null, null, 'aquí estás', 'siguiente', null, null, null, null, null]);
		expect(road.slice(4, 8).map(({ name, spoken }) => `${name}, ${spoken}`)).toEqual(['Discípulo, pasada', 'Viajero, aquí estás', 'Estudioso, la siguiente', 'Erudito, por delante']);
	});

	it('draws each stage’s bust, the current one carrying the figure’s objects', () => {
		const road = card(MID_MOMENT).road;

		expect(road[5]?.avatar).toEqual({ stage: 'traveller', objects: ['lector'] });
		expect(road[0]?.avatar).toEqual({ stage: 'runner', objects: [] });
		expect(road[11]?.avatar).toEqual({ stage: 'sage', objects: [] });
	});
});

describe('stageCardView: what counts today (stage-card S1)', () => {
	it('lists the level, the days, the skills of the vault, the campaigns and the books', () => {
		expect(card(TODAY_MOMENT).today).toEqual({ label: 'Lo que cuenta hoy', text: 'nivel 2 · 11 días · 0 de 14 skills · 0 campañas · 2 libros' });
	});

	it('adds how many skills hold the highest rank reached, from rank 2 on', () => {
		expect(card(MID_MOMENT).today.text).toBe('nivel 12 · 640 días · 5 de 14 skills (1 en rango 2) · 2 campañas · 7 libros');
		expect(card(LAST_MOMENT).today.text).toBe('nivel 30 · 4812 días · 14 de 14 skills (8 en rango 4) · 12 campañas · 52 libros');
		expect(card({ ...MID_MOMENT, evidence: { ...MID_MOMENT.evidence, earned: earned(1), campaigns: 1, books: 1 } }).today.text).toBe('nivel 12 · 640 días · 1 de 14 skills · 1 campaña · 1 libro');
	});
});

describe('portraitButtonLabel: the portrait as a button (stage-card S1)', () => {
	it('names the stage, its number, and that it opens the stages', () => {
		expect(portraitButtonLabel('runner', es)).toBe('Corredor, etapa 1 de 12. Ver las etapas');
		expect(portraitButtonLabel('sage', en)).toBe('Sage, stage 12 of 12. See the stages');
	});
});

describe('stageCardView in English (stage-card S1)', () => {
	it('words the whole card in English', () => {
		const view = card(TODAY_MOMENT, en);

		expect(view).toMatchObject({ ariaLabel: "Nicolás's stages", kicker: 'Stage 1 of 12', title: 'Runner', since: 'On the road since November 1 · 11 days', metText: 'met' });
		expect(view.next).toMatchObject({ before: 'To become ', name: 'Wayfarer' });
		expect(view.next.rows.map(({ label, count, hint }) => [label, count, hint])).toEqual([
			['Level 3', 'level 2 of 3', '248 XP to go'],
			['30 days on the road', '11 of 30 days', '19 days to go: December 1'],
		]);
		expect(view.road.slice(0, 3).map(({ name, spoken, tag }) => [name, spoken, tag])).toEqual([
			['Runner', 'you are here', 'you are here'],
			['Wayfarer', 'the next one', 'next'],
			['Pilgrim', 'ahead', null],
		]);
		expect(view.today).toEqual({ label: 'What counts today', text: 'level 2 · 11 days · 0 of 14 skills · 0 campaigns · 2 books' });
		expect(card(LAST_MOMENT, en).next).toMatchObject({ title: 'The road is complete', note: 'Sage is the last stage. This is what it asks, and you still meet it:' });
	});
});
