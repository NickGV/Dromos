import { describe, expect, it } from 'vitest';
import type { GameSnapshot, SkillEntry } from '../../src/application';
import { skillStanding, type Skill } from '../../src/domain';
import { createTranslator, type Translator } from '../../src/i18n';
import { nextSkillSelection, skillsPageView } from '../../src/ui/presenters/skillsView';
import { skill } from '../domain/skill/skillFixtures';

const es = createTranslator('es');
const en = createTranslator('en');

const RANKS = [0, 1, 2, 3, 4].map((index) => ({ name: `Rango ${index}`, description: `Descripción ${index}` }));

function earned(overrides: Partial<Skill> = {}, xp = 0): SkillEntry {
	const unlocked = skill({ id: 'lector', name: 'Lector', icon: '📖', stat: 'inteligencia', description: 'Leer libros.', ranks: RANKS, unlocked: true, unlockedOn: '2026-11-03', requirements: [], ...overrides });
	const standing = skillStanding(true, xp);
	return { skill: unlocked, xp, standing, rank: RANKS[standing.rankIndex ?? 0] ?? null, requirements: [], recent: [] };
}

function locked(overrides: Partial<Skill> = {}, progress: SkillEntry['requirements'] = []): SkillEntry {
	return {
		skill: skill({ id: 'cuidador', name: 'Cuidador', icon: '🩺', stat: 'vitalidad', description: 'Cuidar el cuerpo.', ...overrides }),
		xp: 0,
		standing: skillStanding(false, 0),
		rank: null,
		requirements: progress,
		recent: [],
	};
}

function snapshot(overrides: Partial<GameSnapshot> = {}): GameSnapshot {
	return {
		status: { kind: 'synced' },
		lastSyncedAt: new Date('2026-11-03T15:00:00.000Z'),
		character: { level: 1, totalXp: 0, xpIntoLevel: 0, xpToNext: 100 },
		skills: [],
		events: [],
		invalidSkills: [],
		unreadable: [],
		invalidRules: null,
		...overrides,
	};
}

describe('skillsPageView: before there is anything to show', () => {
	it.each([
		[{ kind: 'idle' }, 'Las skills aparecerán después de sincronizar con Habitica.'],
		[{ kind: 'syncing' }, 'Cargando las skills…'],
		[{ kind: 'offline' }, 'Las skills aparecerán después de sincronizar con Habitica.'],
		[{ kind: 'no-character' }, 'No hay personaje: crea la nota Character.md para empezar a ganar skills.'],
	] as const)('says what to expect when the status is %j', (status, text) => {
		const view = skillsPageView(snapshot({ status, skills: null, character: null, lastSyncedAt: null }), es);

		expect(view.emptyText).toBe(text);
		expect(view.earned).toEqual([]);
		expect(view.locked).toEqual([]);
	});

	it('says so when the vault has no skill notes', () => {
		expect(skillsPageView(snapshot({ skills: [] }), es).emptyText).toBe('No se encontró ninguna nota de skill en la carpeta Skills.');
	});

	it('speaks English when the interface is in English', () => {
		expect(skillsPageView(snapshot({ status: { kind: 'idle' }, skills: null }), en).emptyText).toBe('Skills will appear after syncing with Habitica.');
	});
});

describe('skillsPageView: earned skills', () => {
	it('shows level, rank with its description, XP bar, stat and the day it was earned', () => {
		const view = skillsPageView(snapshot({ skills: [earned({}, 150)] }), es);

		expect(view.earned).toEqual([
			{
				id: 'lector',
				icon: '📖',
				name: 'Lector',
				statLabel: 'Inteligencia',
				description: 'Leer libros.',
				unlocked: true,
				level: 2,
				levelText: 'Nivel 2',
				rankName: 'Rango 0',
				rankDescription: 'Descripción 0',
				caption: 'Rango 0',
				xp: { current: 50, total: 246, percent: 20, text: '50 / 246 XP' },
				requirements: [],
				progressPercent: 100,
				earnedText: 'Ganada el 2026-11-03',
				recent: [],
			},
		]);
	});

	it('lists the recent entries the game kept for the skill, as they are (game-ui S9)', () => {
		const recent = [
			{ date: '2026-11-03', task: 'Leer capítulo 4', xp: 10, source: 'complete' },
			{ date: '2026-11-02', task: 'Leer capítulo 3', xp: -10, source: 'revert' },
		] as const;

		const view = skillsPageView(snapshot({ skills: [{ ...earned({}, 150), recent }, { ...locked(), recent: [recent[0]] }] }), es);

		expect(view.earned[0]?.recent).toEqual(recent);
		expect(view.locked[0]?.recent).toEqual([recent[0]]);
	});

	it('a skill just earned is level 1 with an empty bar', () => {
		const [card] = skillsPageView(snapshot({ skills: [earned({}, 0)] }), es).earned;

		expect(card).toMatchObject({ levelText: 'Nivel 1', xp: { current: 0, total: 100, percent: 0 } });
	});

	it('names no rank the note does not describe', () => {
		const entry = { ...earned({ ranks: [] }), rank: null };

		const [card] = skillsPageView(snapshot({ skills: [entry] }), es).earned;

		expect(card).toMatchObject({ rankName: null, rankDescription: null });
	});

	it('puts the highest level first, then by name', () => {
		const skills = [earned({ id: 'b', name: 'Beta' }, 0), earned({ id: 'a', name: 'Alfa' }, 0), earned({ id: 'c', name: 'Gamma' }, 150)];

		expect(skillsPageView(snapshot({ skills }), es).earned.map((card) => card.name)).toEqual(['Gamma', 'Alfa', 'Beta']);
	});
});

describe('skillsPageView: skills still to earn', () => {
	const quests = { requirement: { kind: 'quests', count: 5 }, done: 3, total: 5, met: false } as const;
	const habit = { requirement: { kind: 'habit', days: 21 }, done: 12, total: 21, met: false } as const;
	const campaigns = { requirement: { kind: 'campaigns', count: 1 }, done: 0, total: 1, met: false } as const;
	const manual = (confirmed: boolean) =>
		({ requirement: { kind: 'manual', id: 'x', text: 'Pasar el Deep Work Test', confirmed, confirmedOn: null }, done: confirmed ? 1 : 0, total: 1, met: confirmed }) as const;

	it('shows level 0 as no level, no XP bar and no rank, with every requirement and its progress', () => {
		const entry = locked({}, [quests, habit, campaigns, manual(false)]);

		const [card] = skillsPageView(snapshot({ skills: [entry] }), es).locked;

		expect(card).toMatchObject({ unlocked: false, levelText: null, rankName: null, rankDescription: null, xp: null, earnedText: null });
		expect(card?.requirements).toEqual([
			{ text: 'Quests con esta skill: 3 de 5', detail: null, met: false, percent: 60 },
			{ text: 'Racha del hábito: 12 de 21 días', detail: null, met: false, percent: 57 },
			{ text: 'Campañas completadas: 0 de 1', detail: null, met: false, percent: 0 },
			{ text: 'Pasar el Deep Work Test', detail: 'Pendiente', met: false, percent: 0 },
		]);
	});

	it('shows a confirmed manual requirement as confirmed', () => {
		const [card] = skillsPageView(snapshot({ skills: [locked({}, [manual(true)])] }), es).locked;

		expect(card?.requirements).toEqual([{ text: 'Pasar el Deep Work Test', detail: 'Confirmado', met: true, percent: 100 }]);
	});

	it('measures the whole skill as the mean of its requirements', () => {
		const [card] = skillsPageView(snapshot({ skills: [locked({}, [quests, campaigns])] }), es).locked;

		expect(card?.progressPercent).toBe(30);
	});

	it('a skill with no requirements is at 0: only a hand edit unlocks it', () => {
		const [card] = skillsPageView(snapshot({ skills: [locked({}, [])] }), es).locked;

		expect(card).toMatchObject({ progressPercent: 0, requirements: [] });
	});

	it('puts the closest to unlocking first, then by name', () => {
		const skills = [
			locked({ id: 'z', name: 'Zeta' }, [campaigns]),
			locked({ id: 'a', name: 'Alfa' }, [campaigns]),
			locked({ id: 'm', name: 'Medio' }, [quests]),
		];

		expect(skillsPageView(snapshot({ skills }), es).locked.map((card) => card.name)).toEqual(['Medio', 'Alfa', 'Zeta']);
	});

	it('words the requirements in English too', () => {
		const [card] = skillsPageView(snapshot({ skills: [locked({}, [quests, manual(false)])] }), en).locked;

		expect(card?.requirements.map((requirement) => requirement.text)).toEqual(['Quests with this skill: 3 of 5', 'Pasar el Deep Work Test']);
		expect(card?.requirements[1]?.detail).toBe('Pending');
	});
});

describe('skillsPageView: titles, notices and problems', () => {
	it('counts earned and locked skills in the section titles', () => {
		const view = skillsPageView(snapshot({ skills: [earned(), locked(), locked({ id: 'other', name: 'Other' })] }), es);

		expect(view).toMatchObject({ earnedTitle: 'Ganadas (1)', lockedTitle: 'Por desbloquear (2)' });
	});

	it('warns when the last sync failed in the vault but keeps what it knew', () => {
		const view = skillsPageView(snapshot({ status: { kind: 'error' }, skills: [earned()] }), es);

		expect(view.notice).toBe('No se pudieron actualizar las skills. Se muestra el último estado conocido.');
		expect(view.earned).toHaveLength(1);
	});

	it('has no notice when the sync worked', () => {
		expect(skillsPageView(snapshot({ skills: [earned()] }), es).notice).toBeNull();
	});

	it('lists the skill notes it could not read and the ledger rows it could not parse', () => {
		const view = skillsPageView(
			snapshot({
				skills: [earned()],
				invalidSkills: [{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }],
				unreadable: [{ path: 'Dromos/Ledger/2026-11.md', line: 12, text: '| x |' }],
			}),
			en,
		);

		expect(view.problems).toEqual(['Dromos/Skills/bad.md: Unknown stat "x".', 'Unreadable ledger row (Dromos/Ledger/2026-11.md, line 12)']);
	});

	it('names the fields of Rules.md it could not use, before anything else, in both languages', () => {
		const invalidRules = { path: 'Dromos/Rules.md', fields: ['xp.todo.easy', 'rank_levels'] };
		const invalidSkills = [{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }];

		const shown = (t: Translator) => skillsPageView(snapshot({ skills: [earned()], invalidRules, invalidSkills }), t).problems;

		expect(shown(en)[0]).toBe('Dromos/Rules.md: could not use xp.todo.easy, rank_levels. The default values apply instead.');
		expect(shown(createTranslator('es'))[0]).toBe('Dromos/Rules.md: no se pudo usar xp.todo.easy, rank_levels. Se aplican los valores por defecto.');
		expect(shown(en)).toHaveLength(2);
	});

	it('lists each unreadable ledger row with its line, up to five, and counts the rest', () => {
		const unreadable = Array.from({ length: 7 }, (_, index) => ({ path: 'a.md', line: index + 3, text: '' }));

		const problems = skillsPageView(snapshot({ skills: [earned()], unreadable }), en).problems;

		expect(problems).toEqual([
			'Unreadable ledger row (a.md, line 3)',
			'Unreadable ledger row (a.md, line 4)',
			'Unreadable ledger row (a.md, line 5)',
			'Unreadable ledger row (a.md, line 6)',
			'Unreadable ledger row (a.md, line 7)',
			'and 2 more unreadable ledger rows',
		]);
		expect(skillsPageView(snapshot({ skills: [earned()], unreadable: unreadable.slice(0, 6) }), en).problems.at(-1)).toBe('and 1 more unreadable ledger row');
	});
});

describe('skillsPageView: medallions', () => {
	const quests = { requirement: { kind: 'quests', count: 5 }, done: 3, total: 5, met: false } as const;
	const habit = { requirement: { kind: 'habit', days: 21 }, done: 12, total: 21, met: false } as const;
	const campaigns = { requirement: { kind: 'campaigns', count: 1 }, done: 0, total: 1, met: false } as const;

	it('captions a locked skill with the unmet requirement closest to done, and gives it no level', () => {
		const card = skillsPageView(snapshot({ skills: [locked({}, [campaigns, habit, quests])] }), en).locked[0];
		expect(card?.caption).toBe('Quests with this skill: 3 of 5');
		expect(card?.level).toBeNull();
	});

	it('leaves met requirements out of the caption', () => {
		const met = { requirement: { kind: 'quests', count: 5 }, done: 5, total: 5, met: true } as const;
		const card = skillsPageView(snapshot({ skills: [locked({}, [met, campaigns])] }), en).locked[0];
		expect(card?.caption).toBe('Campaigns completed: 0 of 1');
	});

	it('captions an earned skill with its rank and gives its level as a number', () => {
		const card = skillsPageView(snapshot({ skills: [earned({}, 0)] }), en).earned[0];
		expect(card?.caption).toBe(card?.rankName);
		expect(card?.levelText).toBe(`Level ${String(card?.level)}`);
	});
});

describe('nextSkillSelection', () => {
	it('opens a skill, switches to another, and closes the open one when it is chosen again', () => {
		expect(nextSkillSelection(null, 'lector')).toBe('lector');
		expect(nextSkillSelection('lector', 'atleta')).toBe('atleta');
		expect(nextSkillSelection('lector', 'lector')).toBeNull();
	});
});
