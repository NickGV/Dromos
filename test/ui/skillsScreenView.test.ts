import { describe, expect, it } from 'vitest';
import type { GameSnapshot, RecentEntry, SkillEntry } from '../../src/application';
import { skillStanding, type Skill } from '../../src/domain';
import { createTranslator } from '../../src/i18n';
import { skillDetailView, skillsPageView, skillsScreenView } from '../../src/ui/presenters/skillsView';
import { skill } from '../domain/skill/skillFixtures';

const en = createTranslator('en');
const es = createTranslator('es');
const RANKS = ['Novice', 'Reader', 'Scholar', 'Sage', 'Master'].map((name) => ({ name, description: `${name} of books.` }));

function earned(overrides: Partial<Skill> = {}, xp = 0, recent: readonly RecentEntry[] = []): SkillEntry {
	const standing = skillStanding(true, xp);
	return {
		skill: skill({ id: 'lector', name: 'Reader', icon: 'book-open', stat: 'inteligencia', description: 'You read books to the end.', ranks: RANKS, unlocked: true, unlockedOn: '2026-10-20', ...overrides }),
		xp,
		standing,
		rank: RANKS[standing.rankIndex ?? 0] ?? null,
		requirements: [],
		recent,
	};
}

function locked(id: string, name: string, done: number): SkillEntry {
	return {
		skill: skill({ id, name, icon: '🏃', stat: 'fuerza', description: 'You move every day.' }),
		xp: 0,
		standing: skillStanding(false, 0),
		rank: null,
		requirements: [
			{ requirement: { kind: 'habit', days: 21 }, done, total: 21, met: false },
			{ requirement: { kind: 'quests', count: 2 }, done: 2, total: 2, met: true },
		],
		recent: [],
	};
}

function snapshot(skills: readonly SkillEntry[]): GameSnapshot {
	return { status: { kind: 'synced' }, lastSyncedAt: new Date('2026-11-03T12:00:00Z'), character: { level: 1, totalXp: 0, xpIntoLevel: 0, xpToNext: 100 }, skills, events: [], invalidSkills: [], unreadable: [], invalidRules: null };
}

const entry = (date: string, task: string, xp: number, source: RecentEntry['source'] = 'complete'): RecentEntry => ({ date, task, xp, source });

describe('skillsScreenView: the grid of medallions (game-ui S9)', () => {
	const page = skillsPageView(snapshot([locked('atleta', 'Athlete', 6), earned({}, 150)]), en);

	it('lists the earned skills first, then the locked ones', () => {
		expect(skillsScreenView(page, null, en).rings.map((ring) => ring.id)).toEqual(['lector', 'atleta']);
	});

	it('selects the first skill by default, and the one asked for otherwise', () => {
		expect(skillsScreenView(page, null, en).rings.map((ring) => ring.selected)).toEqual([true, false]);
		expect(skillsScreenView(page, 'atleta', en).rings.map((ring) => ring.selected)).toEqual([false, true]);
		expect(skillsScreenView(page, 'atleta', en).detail?.name).toBe('Athlete');
		expect(skillsScreenView(page, 'gone', en).detail?.name).toBe('Reader');
	});

	it('titles its two sections, in both languages', () => {
		const english = skillsScreenView(page, null, en);
		const spanish = skillsScreenView(skillsPageView(snapshot([earned({}, 150)]), es), null, es);

		expect([english.gridTitle, english.detailTitle]).toEqual(['Medallions', 'Detail']);
		expect([spanish.gridTitle, spanish.detailTitle]).toEqual(['Medallones', 'Detalle']);
	});

	it('has no detail while there is no skill', () => {
		expect(skillsScreenView(skillsPageView(snapshot([]), en), null, en)).toMatchObject({ rings: [], detail: null });
	});
});

describe('skillDetailView: an earned skill (game-ui S9)', () => {
	const card = skillsPageView(snapshot([earned({}, 150)]), en).earned[0];
	if (!card) throw new Error('no card');
	const detail = skillDetailView(card, en);

	it('names the level and the rank, and the stat it feeds', () => {
		expect(detail).toMatchObject({ name: 'Reader', earned: true, levelLine: `Level ${String(card.level)} · ${String(card.rankName)}`, feedsText: 'Feeds · Intelligence' });
	});

	it('has the next-level bar with the XP into the level', () => {
		expect(detail.xp).toEqual({ label: `Next level: ${String((card.level ?? 0) + 1)}`, valueText: card.xp?.text, percent: card.xp?.percent, ariaLabel: 'Experience of Reader' });
		expect(detail.requirements).toEqual([]);
	});

	it('says what counts, from the description', () => {
		expect([detail.countsTitle, detail.description]).toEqual(['What counts', 'You read books to the end.']);
	});

	it('speaks Spanish when the interface does', () => {
		const spanish = skillDetailView(skillsPageView(snapshot([earned({}, 150)]), es).earned[0] ?? card, es);

		expect([spanish.feedsText, spanish.countsTitle, spanish.recentTitle, spanish.xp?.label, spanish.xp?.ariaLabel]).toEqual(['Alimenta · Inteligencia', 'Qué cuenta', 'Entradas recientes', `Siguiente nivel: ${String((card.level ?? 0) + 1)}`, 'Experiencia de Reader']);
	});

	it('names the level alone when the skill has no rank', () => {
		const plain = { ...card, rankName: null };
		expect(skillDetailView(plain, en).levelLine).toBe(`Level ${String(card.level)}`);
	});

	it('has no bar when the curve has no next level', () => {
		expect(skillDetailView({ ...card, xp: null }, en).xp).toBeNull();
	});
});

describe('skillDetailView: a locked skill (game-ui S9)', () => {
	const card = skillsPageView(snapshot([locked('atleta', 'Athlete', 6)]), en).locked[0];
	if (!card) throw new Error('no card');
	const detail = skillDetailView(card, en);

	it('says it is locked, with no XP bar', () => {
		expect(detail).toMatchObject({ earned: false, levelLine: 'Locked', xp: null, feedsText: 'Feeds · Strength' });
		expect(skillDetailView(skillsPageView(snapshot([locked('atleta', 'Atleta', 6)]), es).locked[0] ?? card, es).levelLine).toBe('Bloqueada');
	});

	it('lists each requirement with its progress and whether it is met', () => {
		expect(detail.requirementsTitle).toBe('To unlock');
		expect(detail.requirements.map((row) => [row.text, row.percent, row.met])).toEqual([
			['Habit streak: 6 of 21 days', 29, false],
			['Quests with this skill: 2 of 2', 100, true],
		]);
	});

	it('draws the ring as the unlock progress', () => {
		expect(detail.ringPercent).toBe(card.progressPercent);
	});
});

describe('skillDetailView: the recent entries (game-ui S9)', () => {
	const recent = [entry('2026-11-03', 'Clean Architecture · ch. 2', 15), entry('2026-11-02', 'Atomic Habits', 10), entry('2026-10-31', 'Local-first software', -10, 'revert'), entry('2026-10-24', 'Streak of 7 days', 20, 'streak')];
	const card = skillsPageView(snapshot([earned({}, 150, recent)]), en).earned[0];
	if (!card) throw new Error('no card');

	it('reads each entry as task, signed XP and the short date of the campaigns, a revert with a minus sign (game-ui S14)', () => {
		expect(skillDetailView(card, en).recent).toEqual([
			{ task: 'Clean Architecture · ch. 2', detail: '+15 XP · 3 Nov' },
			{ task: 'Atomic Habits', detail: '+10 XP · 2 Nov' },
			{ task: 'Local-first software', detail: '−10 XP · 31 Oct' },
			{ task: 'Streak of 7 days', detail: '+20 XP · 24 Oct' },
		]);
		expect(skillDetailView(card, en).noRecentText).toBeNull();
	});

	it('reads them in Spanish too', () => {
		expect(skillDetailView(card, es).recent.map((row) => row.detail)).toEqual(['+15 XP · 3 nov', '+10 XP · 2 nov', '−10 XP · 31 oct', '+20 XP · 24 oct']);
	});

	it('says there are no entries yet when the skill has none', () => {
		const empty = { ...card, recent: [] };

		expect(skillDetailView(empty, en)).toMatchObject({ recent: [], noRecentText: 'No entries yet' });
		expect(skillDetailView(empty, es).noRecentText).toBe('Aún sin entradas');
	});
});

describe('skillDetailView: the day a skill was earned (game-ui S14)', () => {
	it('is the short date of the campaigns, in both languages', () => {
		const card = skillsPageView(snapshot([earned({ unlockedOn: '2026-10-20' }, 150)]), en).earned[0];
		if (!card) throw new Error('no card');

		expect(skillDetailView(card, en).earnedText).toBe('Earned on 20 Oct');
		expect(skillsPageView(snapshot([earned({ unlockedOn: '2026-10-20' }, 150)]), es).earned[0]?.earnedText).toBe('Ganada el 20 oct');
	});
});
