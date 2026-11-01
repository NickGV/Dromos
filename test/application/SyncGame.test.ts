import { describe, expect, it } from 'vitest';
import { GameState } from '../../src/application/GameState';
import { SyncGame } from '../../src/application/SyncGame';
import type { Campaign, Character, LedgerRow, Skill } from '../../src/domain';
import type { GameRules } from '../../src/domain/rules/GameRules';
import type { CharacterLoadResult, ObservedTask, RulesLoadResult } from '../../src/ports';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { campaign } from '../domain/campaign/campaignFixtures';
import { row } from '../domain/ledger/ledgerFixtures';
import { skill } from '../domain/skill/skillFixtures';
import { FakeGameTaskSource } from '../fakes/FakeGameTaskSource';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';
import { InMemoryGameStateRepository } from '../fakes/InMemoryGameStateRepository';
import { InMemoryLedgerRepository } from '../fakes/InMemoryLedgerRepository';
import { InMemoryRulesRepository } from '../fakes/InMemoryRulesRepository';
import { InMemorySkillRepository } from '../fakes/InMemorySkillRepository';

const NOW = new Date('2026-11-03T15:00:00.000Z');
const TODAY = '2026-11-03';

const NICO: Character = {
	name: 'Nico',
	title: '',
	level: 1,
	totalXp: 0,
	xpIntoLevel: 0,
	xpToNext: 100,
	stats: { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 },
	gameStart: null,
};

/** A locked reading skill that asks for two quests. */
const lector = (overrides: Partial<Skill> = {}): Skill =>
	skill({ id: 'lector', name: 'Lector', stat: 'inteligencia', habiticaTag: 'skill/lector', requirements: [{ kind: 'quests', count: 2 }], ...overrides });

const owned = (overrides: Partial<Skill> = {}): Skill => lector({ unlocked: true, unlockedOn: '2026-11-01', ...overrides });

const todo = (id: string, overrides: Partial<ObservedTask> = {}): ObservedTask => ({
	habiticaId: id,
	title: `Task ${id}`,
	kind: 'todo',
	priority: 1,
	skills: ['lector'],
	completed: true,
	date: TODAY,
	streak: null,
	...overrides,
});

interface Options {
	skills?: Skill[];
	rows?: LedgerRow[];
	character?: CharacterLoadResult;
	completed?: Campaign[];
	tasks?: ObservedTask[];
	credentials?: boolean;
	day?: string;
	rules?: RulesLoadResult;
}

function setup(options: Options = {}) {
	const state = new GameState();
	const skills = new InMemorySkillRepository(options.skills ?? [lector()]);
	const ledger = new InMemoryLedgerRepository(options.rows ?? []);
	const characters = new InMemoryGameStateRepository(options.character ?? { kind: 'found', character: NICO });
	const source = new FakeGameTaskSource(options.tasks ?? []);
	const sync = new SyncGame({
		skills,
		ledger,
		characters,
		campaigns: new InMemoryCampaignRepository([], options.completed ?? []),
		rules: new InMemoryRulesRepository(options.rules),
		source,
		clock: new FixedClock(NOW, options.day ?? TODAY),
		state,
		hasCredentials: () => options.credentials ?? true,
	});
	return { state, skills, ledger, characters, source, sync };
}

describe('SyncGame: what stops it', () => {
	it('starts idle with nothing', () => {
		expect(setup().state.snapshot()).toEqual({ status: { kind: 'idle' }, lastSyncedAt: null, character: null, skills: null, events: [], invalidSkills: [], unreadable: [], invalidRules: null });
	});

	it('does nothing without Habitica credentials', async () => {
		const { sync, source, ledger, characters } = setup({ credentials: false, tasks: [todo('a')] });

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'not-configured' });
		expect(source.calls).toBe(0);
		expect(ledger.appended).toEqual([]);
		expect(characters.saved).toEqual([]);
	});

	it('does nothing when Character.md is missing: the game has nowhere to keep its state', async () => {
		const { sync, source, ledger, skills } = setup({ character: { kind: 'missing', path: 'Dromos/Character.md' }, tasks: [todo('a')] });

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'no-character' });
		expect(source.calls).toBe(0);
		expect(ledger.appended).toEqual([]);
		expect(skills.written).toEqual([]);
	});

	it('reports a vault failure as an error and touches nothing', async () => {
		const { sync, skills, source, ledger } = setup({ tasks: [todo('a')] });
		skills.failWith = new Error('disk');

		expect((await sync.execute()).status).toEqual({ kind: 'error' });
		expect(source.calls).toBe(0);
		expect(ledger.appended).toEqual([]);
	});

	it.each([
		['Offline', { kind: 'offline' }],
		['Unauthorized', { kind: 'unauthorized' }],
		['RateLimited', { kind: 'rate-limited', retryAfterSeconds: 12 }],
		['Unknown', { kind: 'error' }],
	] as const)('maps a Habitica %s failure to the status and writes nothing', async (kind, status) => {
		const { sync, source, ledger, characters } = setup({ tasks: [todo('a')] });
		source.failWith = new TaskSourceError(kind, kind === 'RateLimited' ? 12 : null, 'down');

		expect((await sync.execute()).status).toEqual(status);
		expect(ledger.appended).toEqual([]);
		expect(characters.saved).toEqual([]);
	});

	it('keeps the last good result when a later sync fails', async () => {
		const { sync, source } = setup({ tasks: [todo('a')] });
		const good = await sync.execute();
		source.failWith = new TaskSourceError('Offline', null, 'down');

		const failed = await sync.execute();

		expect(failed.status).toEqual({ kind: 'offline' });
		expect(failed.character).toEqual(good.character);
		expect(failed.lastSyncedAt).toEqual(good.lastSyncedAt);
	});

	it('reports a failed ledger write as an error and writes no projection', async () => {
		const { sync, ledger, skills, characters } = setup({ tasks: [todo('a')] });
		ledger.failAppendWith = new Error('disk');

		expect((await sync.execute()).status).toEqual({ kind: 'error' });
		expect(skills.written).toEqual([]);
		expect(characters.saved).toEqual([]);
	});

	it('keeps the day of an unlock even if the ledger could not be written: the skill note goes first', async () => {
		const { sync, skills, ledger, source } = setup({ tasks: [todo('a'), todo('b')] });
		ledger.failAppendWith = new Error('disk');
		expect((await sync.execute()).status).toEqual({ kind: 'error' });
		expect(skills.written).toEqual([{ skillId: 'lector', projection: { unlocked: true, unlockedOn: TODAY, level: 1, xp: 0, xpToNext: 100 } }]);

		ledger.failAppendWith = null;
		source.tasks = [todo('a'), todo('b'), todo('c')];
		const next = new SyncGame({
			skills,
			ledger,
			characters: new InMemoryGameStateRepository({ kind: 'found', character: NICO }),
			campaigns: new InMemoryCampaignRepository(),
			rules: new InMemoryRulesRepository(),
			source,
			clock: new FixedClock(NOW, '2026-11-04'),
			state: new GameState(),
			hasCredentials: () => true,
		});

		const snapshot = await next.execute();

		expect(snapshot.skills?.[0]?.skill).toMatchObject({ unlocked: true, unlockedOn: TODAY });
		expect(snapshot.events).toEqual([]);
	});

	it('shares one sync between two calls that arrive together', async () => {
		const { sync, source } = setup({ tasks: [todo('a')] });

		const [first, second] = await Promise.all([sync.execute(), sync.execute()]);

		expect(source.calls).toBe(1);
		expect(first).toEqual(second);
	});
});

describe('SyncGame: the game starts from zero (no gifted progress)', () => {
	it('starts counting on the day of the first sync and saves that day in the character', async () => {
		const { sync, characters } = setup({ tasks: [] });

		await sync.execute();

		expect(characters.saved[0]?.gameStart).toBe(TODAY);
	});

	it('ignores what was completed before that day', async () => {
		const { sync, ledger } = setup({ tasks: [todo('old', { date: '2026-11-02' }), todo('older', { date: '2026-10-01' })] });

		const snapshot = await sync.execute();

		expect(ledger.appended).toEqual([]);
		expect(snapshot.character).toMatchObject({ level: 1, totalXp: 0 });
	});

	it('counts what is completed the day of the first sync', async () => {
		const { sync, ledger } = setup({ tasks: [todo('today')] });

		const snapshot = await sync.execute();

		expect(ledger.appended.flat()).toEqual([row({ habiticaId: 'today', task: 'Task today', date: TODAY, xp: 10 })]);
		expect(snapshot.character?.totalXp).toBe(10);
	});

	it('keeps the start it already has: a later day does not move it', async () => {
		const character: CharacterLoadResult = { kind: 'found', character: { ...NICO, gameStart: '2026-11-01' } };
		const { sync, ledger } = setup({ character, tasks: [todo('since', { date: '2026-11-01' })] });

		await sync.execute();

		expect(ledger.appended.flat()).toHaveLength(1);
	});
});

describe('SyncGame: XP, unlocks and the projection', () => {
	it('a locked skill gives the character XP but none of its own, and stays locked below its requirement', async () => {
		const { sync, skills } = setup({ tasks: [todo('a')] });

		const snapshot = await sync.execute();

		const entry = snapshot.skills?.[0];
		expect(entry).toMatchObject({ xp: 0, standing: { level: 0, xpToNext: null, rankIndex: null }, requirements: [{ done: 1, total: 2, met: false }] });
		expect(entry?.skill.unlocked).toBe(false);
		expect(skills.written).toEqual([]);
	});

	it('unlocks the skill the day its requirements are met, at level 1 with 0 XP, and says so once', async () => {
		const { sync, skills } = setup({ tasks: [todo('a'), todo('b')] });

		const snapshot = await sync.execute();

		expect(snapshot.skills?.[0]).toMatchObject({ xp: 0, standing: { level: 1, xpIntoLevel: 0, xpToNext: 100, rankIndex: 0 } });
		expect(snapshot.skills?.[0]?.skill).toMatchObject({ unlocked: true, unlockedOn: TODAY });
		expect(snapshot.events).toEqual([{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' }]);
		expect(skills.written).toEqual([{ skillId: 'lector', projection: { unlocked: true, unlockedOn: TODAY, level: 1, xp: 0, xpToNext: 100 } }]);
	});

	it('the quests of the day of the unlock count for the requirement and the character, not for the skill', async () => {
		const { sync } = setup({ tasks: [todo('a'), todo('b')] });

		const snapshot = await sync.execute();

		expect(snapshot.character?.totalXp).toBe(20);
		expect(snapshot.skills?.[0]?.xp).toBe(0);
	});

	it('an unlocked skill earns XP from the day after the unlock, and feeds its stat', async () => {
		const { sync, characters } = setup({ skills: [owned()], tasks: [todo('a', { priority: 1.5 })], rows: [] });

		const snapshot = await sync.execute();

		expect(snapshot.skills?.[0]?.xp).toBe(15);
		expect(characters.saved[0]?.stats).toMatchObject({ inteligencia: 1, fuerza: 0 });
	});

	it('gives the full XP to each skill of a quest and counts the character once', async () => {
		const atleta = owned({ id: 'atleta', name: 'Atleta', stat: 'fuerza', habiticaTag: 'skill/atleta' });
		const { sync, characters } = setup({ skills: [owned(), atleta], tasks: [todo('a', { skills: ['lector', 'atleta'] })] });

		const snapshot = await sync.execute();

		expect(snapshot.skills?.map((entry) => entry.xp)).toEqual([10, 10]);
		expect(snapshot.character?.totalXp).toBe(10);
		expect(characters.saved[0]?.stats).toMatchObject({ inteligencia: 1, fuerza: 1 });
	});

	it('syncing twice appends nothing the second time and repeats no event', async () => {
		const { sync, ledger, skills, characters } = setup({ tasks: [todo('a'), todo('b')] });
		const first = await sync.execute();

		const second = await sync.execute();

		expect(ledger.appended).toHaveLength(1);
		expect(skills.written).toHaveLength(1);
		expect(characters.saved).toHaveLength(2);
		expect(second.events).toEqual(first.events);
	});

	it('unchecking a task reverts its XP, and checking it again restores it', async () => {
		const { sync, source } = setup({ skills: [owned()], tasks: [todo('a')] });
		await sync.execute();

		source.tasks = [todo('a', { completed: false })];
		const reverted = await sync.execute();
		source.tasks = [todo('a')];
		const restored = await sync.execute();

		expect(reverted.character?.totalXp).toBe(0);
		expect(reverted.skills?.[0]?.xp).toBe(0);
		expect(restored.character?.totalXp).toBe(10);
		expect(restored.skills?.[0]?.xp).toBe(10);
	});

	it('an unlock stays when the quests that earned it are unchecked', async () => {
		const { sync, source } = setup({ tasks: [todo('a'), todo('b')] });
		await sync.execute();

		source.tasks = [todo('a', { completed: false }), todo('b', { completed: false })];
		const snapshot = await sync.execute();

		expect(snapshot.skills?.[0]?.skill.unlocked).toBe(true);
	});

	it('a skill unlocked by hand without a date gets the day of the sync', async () => {
		const { sync, skills } = setup({ skills: [lector({ unlocked: true, unlockedOn: null })] });

		const snapshot = await sync.execute();

		expect(snapshot.skills?.[0]?.skill).toMatchObject({ unlocked: true, unlockedOn: TODAY });
		expect(snapshot.events).toEqual([{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' }]);
		expect(skills.written[0]?.projection).toMatchObject({ unlocked: true, unlockedOn: TODAY });
	});

	it('a completed campaign of the skill counts toward a campaigns requirement', async () => {
		const reader = lector({ requirements: [{ kind: 'campaigns', count: 1 }] });
		const { sync } = setup({ skills: [reader], completed: [campaign({ status: 'completed', skills: ['lector'] })] });

		expect((await sync.execute()).skills?.[0]?.skill.unlocked).toBe(true);
	});

	it('a habit requirement is met by the streak of a daily tagged with the skill, and a manual one waits for its confirmation', async () => {
		const habit = lector({ requirements: [{ kind: 'habit', days: 21 }] });
		const tagged = (streak: number) => todo('sleep', { kind: 'daily', completed: false, streak });

		const short = setup({ skills: [habit], tasks: [tagged(20)] });
		expect((await short.sync.execute()).skills?.[0]).toMatchObject({ skill: { unlocked: false }, requirements: [{ done: 20, total: 21, met: false }] });

		const long = setup({ skills: [habit], tasks: [tagged(21)] });
		expect((await long.sync.execute()).skills?.[0]?.skill.unlocked).toBe(true);

		const waiting = lector({ requirements: [{ kind: 'habit', days: 21 }, { kind: 'manual', id: 'x', text: 'Done', confirmed: false, confirmedOn: null }] });
		const both = setup({ skills: [waiting], tasks: [tagged(30)] });
		expect((await both.sync.execute()).skills?.[0]?.skill.unlocked).toBe(false);
	});

	it('saves the character with the level, the XP and the stats of the ledger, and the day of the sync', async () => {
		const { sync, characters } = setup({ tasks: [todo('a', { skills: [] })] });

		await sync.execute();

		expect(characters.saved).toEqual([
			{ level: 1, totalXp: 10, xpToNext: 100, stats: { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 }, gameStart: TODAY, lastSync: NOW.toISOString() },
		]);
	});

	it('dailies without a skill feed disciplina', async () => {
		const stretch = todo('d', { kind: 'daily', skills: [], priority: 2 });
		const { sync, characters } = setup({ tasks: [stretch] });

		await sync.execute();

		expect(characters.saved[0]?.stats).toMatchObject({ disciplina: 1, inteligencia: 0 });
	});

	it('pays the streak bonus of a daily once', async () => {
		const stretch = todo('d', { kind: 'daily', skills: [], streak: 7, priority: 1 });
		const { sync } = setup({ tasks: [stretch] });

		await sync.execute();
		const second = await sync.execute();

		expect(second.character?.totalXp).toBe(15);
	});
});

describe('SyncGame: level-ups', () => {
	it('announces the level of the character and of a skill, with its rank', async () => {
		const reader = owned({ ranks: [0, 1, 2, 3, 4].map((index) => ({ name: `Rank ${index}`, description: '' })) });
		const hard = [1, 2, 3, 4].map((n) => todo(`h${n}`, { priority: 2 }));
		const { sync } = setup({ skills: [reader], tasks: hard });

		const snapshot = await sync.execute();

		expect(snapshot.events).toEqual([
			{ kind: 'character-level', level: 2 },
			{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 2, rank: 'Rank 0', rankChanged: false },
		]);
	});

	it('keeps the events of earlier syncs until they are dismissed', async () => {
		const { sync, state, source } = setup({ skills: [owned()], tasks: [1, 2, 3, 4].map((n) => todo(`h${n}`, { priority: 2 })) });
		await sync.execute();

		source.tasks = [...source.tasks, todo('more', { priority: 2 })];
		const second = await sync.execute();
		expect(second.events).toHaveLength(2);

		state.dismissEvents();
		expect(state.snapshot().events).toEqual([]);
		expect(state.snapshot().character).not.toBeNull();
	});

	it('announces nothing when nothing changed level', async () => {
		const { sync } = setup({ skills: [owned()], tasks: [todo('a')] });

		expect((await sync.execute()).events).toEqual([]);
	});
});

describe('SyncGame: what it shows', () => {
	it('lists the skill notes it could not read and the ledger rows it could not parse', async () => {
		const state = new GameState();
		const sync = new SyncGame({
			skills: new InMemorySkillRepository([lector()], [{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }]),
			ledger: new InMemoryLedgerRepository([], [{ path: 'Dromos/Ledger/2026-11.md', line: 12, text: '| broken |' }]),
			characters: new InMemoryGameStateRepository({ kind: 'found', character: NICO }),
			campaigns: new InMemoryCampaignRepository(),
			rules: new InMemoryRulesRepository(),
			source: new FakeGameTaskSource(),
			clock: new FixedClock(NOW, TODAY),
			state,
			hasCredentials: () => true,
		});

		const snapshot = await sync.execute();

		expect(snapshot.invalidSkills).toEqual([{ path: 'Dromos/Skills/bad.md', reason: 'Unknown stat "x".' }]);
		expect(snapshot.unreadable).toEqual([{ path: 'Dromos/Ledger/2026-11.md', line: 12, text: '| broken |' }]);
		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(snapshot.lastSyncedAt).toEqual(NOW);
	});
});

describe('SyncGame: Rules.md (S16)', () => {
	const RULES: GameRules = {
		xp: { todo: { trivial: 1, easy: 40, medium: 3, hard: 4 }, daily: { trivial: 6, easy: 7, medium: 8, hard: 9 }, streakBonus: { every: 3, xp: 50 } },
		characterCurve: { base: 10, exponent: 1 },
		skillCurve: { base: 20, exponent: 1 },
		rankLevels: [1, 2, 3, 4, 5],
	};
	const withRules = { rules: RULES, invalid: null };

	it('prices a new row by the rules', async () => {
		const { sync, ledger } = setup({ skills: [owned()], tasks: [todo('a')], rules: withRules });

		await sync.execute();

		expect(ledger.appended.flat().map((paid) => paid.xp)).toEqual([40]);
	});

	it('keeps what a row already paid when the XP table changes', async () => {
		const { sync, characters } = setup({ skills: [owned()], rows: [row({ xp: 10, date: '2026-11-02' })], tasks: [], rules: withRules });

		await sync.execute();

		expect(characters.saved[0]?.totalXp).toBe(10);
	});

	it('turns the ledger into levels with the curves and the rank levels of the rules', async () => {
		const rows = [row({ xp: 40, date: '2026-11-02' })];
		const { sync, characters, skills } = setup({ skills: [owned()], rows, tasks: [], rules: withRules });

		const snapshot = await sync.execute();

		// Character: 10 to level 2, 20 to level 3, then 30 asked. Skill: 20 to level 2, then 40 asked.
		expect(characters.saved[0]).toMatchObject({ level: 3, totalXp: 40, xpToNext: 30, stats: { inteligencia: 2 } });
		expect(skills.projections.get('lector')).toMatchObject({ level: 2, xp: 40, xpToNext: 40 });
		expect(snapshot.skills?.[0]?.standing).toEqual({ level: 2, xpIntoLevel: 20, xpToNext: 40, rankIndex: 1 });
	});

	it('does not celebrate a level that only a changed curve moved', async () => {
		const rows = [row({ xp: 40, date: '2026-11-02' })];
		const { sync } = setup({ skills: [owned()], rows, tasks: [], rules: withRules });

		expect((await sync.execute()).events).toEqual([]);
	});

	it('shows which fields of the note could not be used, and still syncs', async () => {
		const invalid = { path: 'Dromos/Rules.md', fields: ['xp.todo.easy'] };
		const { sync } = setup({ rules: { rules: RULES, invalid } });

		const snapshot = await sync.execute();

		expect(snapshot.invalidRules).toEqual(invalid);
		expect(snapshot.status).toEqual({ kind: 'synced' });
	});
});
