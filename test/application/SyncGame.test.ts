import { describe, expect, it, vi } from 'vitest';
import { GameState } from '../../src/application/GameState';
import { SyncGame } from '../../src/application/SyncGame';
import type { Campaign, Character, LedgerRow, Skill } from '../../src/domain';
import { DEFAULT_RULES, type GameRules } from '../../src/domain/rules/GameRules';
import type { CharacterLoadResult, ObservedTask, RulesLoadResult, UnreadableLedgerEvent } from '../../src/ports';
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
	unreadable?: UnreadableLedgerEvent[];
}

function setup(options: Options = {}) {
	const state = new GameState();
	const skills = new InMemorySkillRepository(options.skills ?? [lector()]);
	const ledger = new InMemoryLedgerRepository(options.rows ?? [], options.unreadable ?? []);
	const characters = new InMemoryGameStateRepository(options.character ?? { kind: 'found', character: NICO });
	const source = new FakeGameTaskSource(options.tasks ?? []);
	const rules = new InMemoryRulesRepository(options.rules);
	const sync = new SyncGame({
		skills,
		ledger,
		characters,
		campaigns: new InMemoryCampaignRepository([], options.completed ?? []),
		rules,
		source,
		clock: new FixedClock(NOW, options.day ?? TODAY),
		state,
		hasCredentials: () => options.credentials ?? true,
	});
	return { state, skills, ledger, characters, source, rules, sync };
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

describe('SyncGame: rebuild (S17)', () => {
	const paid = [row({ xp: 40, date: '2026-11-02' }), row({ habiticaId: 'task-2', xp: 60, date: '2026-11-02' })];
	const missing: CharacterLoadResult = { kind: 'missing', path: 'Dromos/Character.md' };
	const stats = { fuerza: 0, vitalidad: 0, inteligencia: 2, sabiduria: 0, espiritu: 0, disciplina: 0 };
	const rebuiltCharacter = { level: 2, totalXp: 100, xpToNext: 283, stats, gameStart: '2026-11-02', lastSync: null };

	it('recomputes the notes from the ledger, asking nothing of Habitica and adding no rows', async () => {
		const { sync, source, ledger, characters, skills } = setup({ skills: [owned()], rows: paid });

		const outcome = await sync.rebuild();

		expect(source.calls).toBe(0);
		expect(ledger.appended).toEqual([]);
		expect(characters.saved).toEqual([rebuiltCharacter]);
		expect(skills.projections.get('lector')).toEqual({ unlocked: true, unlockedOn: '2026-11-01', level: 2, xp: 100, xpToNext: 246 });
		expect(outcome).toEqual({ kind: 'rebuilt', level: 2, totalXp: 100, createdCharacter: false, unreadableRows: 0 });
	});

	it('needs no Habitica account', async () => {
		const { sync } = setup({ skills: [owned()], rows: paid, credentials: false });

		expect((await sync.rebuild()).kind).toBe('rebuilt');
	});

	it('shows the rebuilt state without claiming a sync happened', async () => {
		const { sync, state } = setup({ skills: [owned()], rows: paid });

		await sync.rebuild();

		const snapshot = state.snapshot();
		expect(snapshot.character).toEqual({ level: 2, totalXp: 100, xpIntoLevel: 0, xpToNext: 283 });
		expect(snapshot.skills?.[0]?.xp).toBe(100);
		expect(snapshot.lastSyncedAt).toBeNull();
		expect(snapshot.status).toEqual({ kind: 'idle' });
	});

	it('leaves a synced state as synced, and clears a failure the notes no longer reflect', async () => {
		const synced = setup({ skills: [owned()], rows: paid });
		await synced.sync.execute();
		await synced.sync.rebuild();
		expect(synced.state.snapshot().status).toEqual({ kind: 'synced' });

		const failed = setup({ skills: [owned()], rows: paid });
		failed.source.failWith = new TaskSourceError('Offline', null, 'down');
		await failed.sync.execute();
		expect(failed.state.snapshot().status).toEqual({ kind: 'offline' });
		await failed.sync.rebuild();
		expect(failed.state.snapshot().status).toEqual({ kind: 'idle' });
	});

	it('creates Character.md again when it is missing, with its created date', async () => {
		const { sync, characters, state } = setup({ skills: [owned()], rows: paid, character: missing });

		const outcome = await sync.rebuild();

		expect(characters.created).toEqual([{ projection: rebuiltCharacter, created: TODAY }]);
		expect(characters.saved).toEqual([]);
		expect(outcome).toMatchObject({ kind: 'rebuilt', createdCharacter: true });
		expect(state.snapshot().status).toEqual({ kind: 'idle' });
	});

	it('gives back the same derived fields as the note that was deleted', async () => {
		const { sync, characters } = setup({ skills: [owned()], tasks: [todo('a'), todo('b')] });
		await sync.execute();
		const original = characters.saved.at(-1);
		characters.set(missing);

		await sync.rebuild();

		expect(characters.created[0]?.projection).toEqual({ ...original, lastSync: null });
	});

	it('lets the next sync play on the note it created', async () => {
		const { sync, characters } = setup({ skills: [owned()], rows: paid, character: missing, tasks: [todo('a')] });
		await sync.rebuild();

		const snapshot = await sync.execute();

		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(characters.saved.at(-1)?.totalXp).toBe(110);
	});

	it('never starts the game: with an empty ledger a game not started stays that way', async () => {
		const { sync, characters } = setup({ skills: [lector()], rows: [] });

		await sync.rebuild();

		expect(characters.saved[0]?.gameStart).toBeNull();
	});

	it('keeps the start of a game already running', async () => {
		const { sync, characters } = setup({ skills: [owned()], rows: paid, character: { kind: 'found', character: { ...NICO, gameStart: '2026-10-30' } } });

		await sync.rebuild();

		expect(characters.saved[0]?.gameStart).toBe('2026-10-30');
	});

	it('applies a changed curve at once, and celebrates nothing', async () => {
		const rules: GameRules = { ...DEFAULT_RULES, characterCurve: { base: 10, exponent: 1 } };
		const { sync, characters, state } = setup({ skills: [owned()], rows: paid, rules: { rules, invalid: null } });

		const outcome = await sync.rebuild();

		// 10 + 20 + 30 + 40 is exactly 100 XP, so level 5, which asks for 50.
		expect(characters.saved[0]).toMatchObject({ level: 5, totalXp: 100, xpToNext: 50 });
		expect(outcome).toMatchObject({ level: 5 });
		expect(state.snapshot().events).toEqual([]);
	});

	it('announces an unlock it decides, which no later sync would announce', async () => {
		const quests = [row({ habiticaId: 'a', date: '2026-11-02' }), row({ habiticaId: 'b', date: '2026-11-02' })];
		const { sync, state, skills } = setup({ skills: [lector()], rows: quests });

		await sync.rebuild();

		expect(skills.projections.get('lector')).toMatchObject({ unlocked: true, unlockedOn: TODAY });
		expect(state.snapshot().events).toEqual([{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' }]);
	});

	it('keeps an unlock its requirements no longer show: unlocks are permanent', async () => {
		const { sync, skills } = setup({ skills: [owned()], rows: [] });

		await sync.rebuild();

		expect(skills.projections.get('lector')).toMatchObject({ unlocked: true, unlockedOn: '2026-11-01' });
	});

	it('remembers the habit streaks of the last sync, since it cannot ask Habitica', async () => {
		const habit = lector({ requirements: [{ kind: 'habit', days: 30 }] });
		const daily = todo('d', { kind: 'daily', streak: 12 });
		const { sync, state } = setup({ skills: [habit], tasks: [daily] });
		await sync.execute();

		await sync.rebuild();

		expect(state.snapshot().skills?.[0]?.requirements[0]).toMatchObject({ done: 12, total: 30 });
	});

	it('says how many ledger rows it had to leave out', async () => {
		const unreadable = [{ path: 'Dromos/Ledger/2026-11.md', line: 12, text: '| broken |' }];
		const { sync, state } = setup({ skills: [owned()], rows: paid, unreadable });

		expect(await sync.rebuild()).toMatchObject({ unreadableRows: 1 });
		expect(state.snapshot().unreadable).toEqual(unreadable);
	});

	it('never rejects: a failed read answers failed and leaves the state alone', async () => {
		const { sync, ledger, skills, state, characters } = setup({ skills: [owned()], rows: paid });
		ledger.failReadWith = new Error('disk');

		expect(await sync.rebuild()).toEqual({ kind: 'failed' });
		expect(skills.projections.size).toBe(0);
		expect(characters.saved).toEqual([]);
		expect(state.snapshot().character).toBeNull();
	});

	it('answers failed when a write fails, and a later rebuild repairs it', async () => {
		const { sync, skills, characters } = setup({ skills: [owned()], rows: paid });
		const save = characters.saveCharacter.bind(characters);
		characters.saveCharacter = () => Promise.reject(new Error('disk'));

		expect(await sync.rebuild()).toEqual({ kind: 'failed' });
		expect(skills.projections.get('lector')).toMatchObject({ xp: 100 });

		characters.saveCharacter = save;
		expect((await sync.rebuild()).kind).toBe('rebuilt');
		expect(characters.saved).toEqual([rebuiltCharacter]);
	});

	it('answers failed when the note disappears between the read and the write', async () => {
		const { sync, characters } = setup({ skills: [owned()], rows: paid, character: missing });
		characters.loadCharacter = () => Promise.resolve({ kind: 'found', character: NICO });

		expect(await sync.rebuild()).toEqual({ kind: 'failed' });
	});

	it('waits for a sync in flight, so it reads the rows that sync wrote', async () => {
		const { sync, characters } = setup({ skills: [owned()], tasks: [todo('a')] });

		const [, outcome] = await Promise.all([sync.execute(), sync.rebuild()]);

		expect(outcome).toMatchObject({ kind: 'rebuilt', totalXp: 10 });
		expect(characters.saved.map((saved) => saved.lastSync)).toEqual([NOW.toISOString(), null]);
	});

	it('makes a sync asked meanwhile wait its turn instead of dropping it', async () => {
		const { sync, source, characters } = setup({ skills: [owned()], tasks: [todo('a')] });

		const [outcome, snapshot] = await Promise.all([sync.rebuild(), sync.execute()]);

		expect(outcome).toMatchObject({ kind: 'rebuilt', totalXp: 0 });
		expect(source.calls).toBe(1);
		expect(snapshot.status).toEqual({ kind: 'synced' });
		expect(characters.saved.map((saved) => saved.lastSync)).toEqual([null, NOW.toISOString()]);
	});

	it('keeps reading syncing while a sync waits behind several rebuilds', async () => {
		const { sync, state } = setup({ skills: [owned()] });

		const first = sync.rebuild();
		const second = sync.rebuild();
		const syncing = sync.execute();
		await first;

		expect(state.snapshot().status).toEqual({ kind: 'syncing' });
		await Promise.all([second, syncing]);
		expect(state.snapshot().status).toEqual({ kind: 'synced' });
	});

	it('still reads syncing at once when a sync has to wait for a rebuild', async () => {
		const { sync, state } = setup({ skills: [owned()] });

		const rebuilding = sync.rebuild();
		const syncing = sync.execute();

		expect(state.snapshot().status).toEqual({ kind: 'syncing' });
		await Promise.all([rebuilding, syncing]);
		expect(state.snapshot().status).toEqual({ kind: 'synced' });
	});
});

describe('SyncGame: what is still to announce (S18)', () => {
	const unlocks = { skills: [lector()], tasks: [todo('a'), todo('b')] };
	const unlocked = { kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' };

	it('hands over what a sync produced exactly once', async () => {
		const { sync, state } = setup(unlocks);
		await sync.execute();

		expect(state.takeAnnouncements()).toEqual([unlocked]);
		expect(state.takeAnnouncements()).toEqual([]);
	});

	it('leaves the banner alone: it keeps its events until it is closed', async () => {
		const { sync, state } = setup(unlocks);
		await sync.execute();

		state.takeAnnouncements();

		expect(state.snapshot().events).toEqual([unlocked]);
	});

	it('does not lose them when the banner was closed first', async () => {
		const { sync, state } = setup(unlocks);
		await sync.execute();

		state.dismissEvents();

		expect(state.takeAnnouncements()).toEqual([unlocked]);
	});

	it('a second sync with nothing new has nothing to announce', async () => {
		const { sync, state } = setup(unlocks);
		await sync.execute();
		state.takeAnnouncements();

		await sync.execute();

		expect(state.takeAnnouncements()).toEqual([]);
	});

	it('holds what a rebuild decided too', async () => {
		const quests = [row({ habiticaId: 'a', date: '2026-11-02' }), row({ habiticaId: 'b', date: '2026-11-02' })];
		const { sync, state } = setup({ skills: [lector()], rows: quests });

		await sync.rebuild();

		expect(state.takeAnnouncements()).toEqual([unlocked]);
	});

	it('keeps an unlock whose note was written when a later write fails, since no later sync would report it', async () => {
		const { sync, ledger, state } = setup(unlocks);
		ledger.failAppendWith = new Error('disk');

		expect((await sync.execute()).status).toEqual({ kind: 'error' });
		expect(state.takeAnnouncements()).toEqual([unlocked]);
		expect(state.snapshot().events).toEqual([unlocked]);

		ledger.failAppendWith = null;
		await sync.execute();

		expect(state.takeAnnouncements()).toEqual([]);
		expect(state.snapshot().events).toEqual([unlocked]);
	});

	it('reports nothing for a note it could not write: the next sync will', async () => {
		const { sync, skills, state } = setup(unlocks);
		const write = skills.writeProjection.bind(skills);
		skills.writeProjection = () => Promise.reject(new Error('disk'));

		await sync.execute();
		expect(state.takeAnnouncements()).toEqual([]);

		skills.writeProjection = write;
		await sync.execute();
		expect(state.takeAnnouncements()).toEqual([unlocked]);
	});

	it('keeps the unlock of a rebuild that fails on the character note', async () => {
		const quests = [row({ habiticaId: 'a', date: '2026-11-02' }), row({ habiticaId: 'b', date: '2026-11-02' })];
		const { sync, characters, state } = setup({ skills: [lector()], rows: quests });
		characters.saveCharacter = () => Promise.resolve('missing');

		expect(await sync.rebuild()).toEqual({ kind: 'failed' });
		expect(state.takeAnnouncements()).toEqual([unlocked]);
	});

	it('starts empty', () => {
		expect(setup().state.takeAnnouncements()).toEqual([]);
	});
});

describe('SyncGame: what each quest pays (game-ui S6)', () => {
	const TABLE = { todo: { trivial: 1, easy: 2, medium: 3, hard: 40 }, daily: { trivial: 6, easy: 7, medium: 8, hard: 9 }, streakBonus: { every: 7, xp: 10 } };
	const priced: RulesLoadResult = { rules: { ...DEFAULT_RULES, xp: TABLE }, invalid: null };
	const cuidador = skill({ id: 'cuidador', name: 'Cuidador', requirements: [] });

	it('prices every task it read as the ledger pays it, naming each skill, with no request of its own', async () => {
		const tasks = [
			todo('a', { priority: 2, skills: ['lector', 'cuidador'] }),
			todo('b', { priority: 0.1, skills: ['sin-nota'], completed: false }),
			todo('d', { kind: 'daily', priority: 1, skills: [], completed: false, streak: 0 }),
		];
		const { sync, source, ledger } = setup({ skills: [owned(), cuidador], tasks, rules: priced });

		const snapshot = await sync.execute();

		expect(snapshot.questPrices).toEqual(
			new Map([
				['a', { xp: 40, skills: [{ id: 'lector', name: 'Lector' }, { id: 'cuidador', name: 'Cuidador' }] }],
				['b', { xp: 1, skills: [{ id: 'sin-nota', name: 'sin-nota' }] }],
				['d', { xp: 7, skills: [] }],
			]),
		);
		expect(ledger.appended.flat().map((paid) => [paid.habiticaId, paid.skill, paid.xp])).toEqual([
			['a', 'lector', 40],
			['a', 'cuidador', 40],
		]);
		expect(source.calls).toBe(1);
	});

	it('has no prices before the first game sync, and keeps the last ones when a sync fails', async () => {
		const { sync, source, state } = setup({ skills: [owned()], tasks: [todo('a', { completed: false })] });
		expect(state.snapshot().questPrices).toBeUndefined();

		const good = await sync.execute();
		source.failWith = new TaskSourceError('Offline', null, 'down');
		const failed = await sync.execute();

		expect(good.questPrices).toEqual(new Map([['a', { xp: 10, skills: [{ id: 'lector', name: 'Lector' }] }]]));
		expect(failed.status).toEqual({ kind: 'offline' });
		expect(failed.questPrices).toBe(good.questPrices);
	});

	it('a rebuild prices the tasks the last sync read by the rules it reads now, asking Habitica nothing', async () => {
		const { sync, source, rules, state } = setup({ skills: [owned()], tasks: [todo('a', { completed: false })] });
		await sync.execute();
		rules.result = priced;

		await sync.rebuild();

		expect(state.snapshot().questPrices).toEqual(new Map([['a', { xp: 2, skills: [{ id: 'lector', name: 'Lector' }] }]]));
		expect(source.calls).toBe(1);
	});
});

describe('SyncGame: the recent entries of each skill (game-ui S9)', () => {
	const cuidador = skill({ id: 'cuidador', name: 'Cuidador', requirements: [] });
	const escritor = skill({ id: 'escritor', name: 'Escritor', requirements: [] });
	const history = [
		row({ habiticaId: 'h1', task: 'One', date: '2026-10-27' }),
		row({ habiticaId: 'h2', task: 'Two', date: '2026-10-28' }),
		row({ habiticaId: 'h3', task: 'Three', date: '2026-10-30', xp: 15 }),
		row({ habiticaId: 'h3', task: 'Three', date: '2026-10-30', xp: -15, source: 'revert' }),
		row({ habiticaId: 'h4', task: 'Four', date: '2026-10-29', xp: 25 }),
		row({ habiticaId: 'h5', task: 'Five', date: '2026-10-31', xp: 5, kind: 'daily' }),
		row({ habiticaId: 'h5', task: 'Five', date: '2026-10-31', xp: 5, kind: 'daily' }),
		row({ habiticaId: 'h6', task: 'Care', skill: 'cuidador', date: '2026-11-01' }),
		row({ habiticaId: 'h7', task: 'Plain', skill: null, date: '2026-11-02' }),
	];

	it('keeps the last five rows of each skill, newest first and signed, from the one read of the ledger', async () => {
		const { sync, ledger } = setup({ skills: [owned(), cuidador, escritor], rows: history, tasks: [todo('a', { title: 'Read today' })] });
		const reads = vi.spyOn(ledger, 'readAll');

		const snapshot = await sync.execute();

		const recent = new Map(snapshot.skills?.map((entry) => [entry.skill.id, entry.recent]));
		expect(recent.get('lector')).toEqual([
			{ date: '2026-11-03', task: 'Read today', xp: 10, source: 'complete' },
			{ date: '2026-10-31', task: 'Five', xp: 5, source: 'complete' },
			{ date: '2026-10-30', task: 'Three', xp: -15, source: 'revert' },
			{ date: '2026-10-30', task: 'Three', xp: 15, source: 'complete' },
			{ date: '2026-10-29', task: 'Four', xp: 25, source: 'complete' },
		]);
		expect(recent.get('cuidador')).toEqual([{ date: '2026-11-01', task: 'Care', xp: 10, source: 'complete' }]);
		expect(recent.get('escritor')).toEqual([]);
		expect(reads).toHaveBeenCalledTimes(1);
	});

	it('a rebuild shows them too, from the ledger alone', async () => {
		const { sync, state } = setup({ skills: [owned()], rows: history.slice(0, 2) });

		await sync.rebuild();

		expect(state.snapshot().skills?.[0]?.recent).toEqual([
			{ date: '2026-10-28', task: 'Two', xp: 10, source: 'complete' },
			{ date: '2026-10-27', task: 'One', xp: 10, source: 'complete' },
		]);
	});
});

const PREVIOUS_CHARACTER = {
	level: 1,
	totalXp: 20,
	xpToNext: 100,
	stats: { fuerza: 0, vitalidad: 0, inteligencia: 1, sabiduria: 0, espiritu: 0, disciplina: 0 },
	gameStart: '2026-11-02',
	lastSync: NOW.toISOString(),
};
const PREVIOUS_PROJECTION = { unlocked: true, unlockedOn: '2026-11-01', level: 1, xp: 20, xpToNext: 100 };
const PREVIOUS_STANDING = { level: 1, totalXp: 20, xpIntoLevel: 20, xpToNext: 100 };
const PREVIOUS_SKILL_STANDING = { level: 1, xpIntoLevel: 20, xpToNext: 100, rankIndex: 0 };

describe('SyncGame: what a sync showed and wrote before game-ui stays the same', () => {
	it('writes the same rows and projection and shows the same character and skill', async () => {
		const { sync, ledger, characters, skills } = setup({ skills: [owned()], rows: [row({ habiticaId: 'old', date: '2026-11-02' })], tasks: [todo('a')] });

		const snapshot = await sync.execute();

		expect(ledger.appended).toEqual([[row({ habiticaId: 'a', task: 'Task a', xp: 10 })]]);
		expect(characters.saved).toEqual([PREVIOUS_CHARACTER]);
		expect(skills.projections.get('lector')).toEqual(PREVIOUS_PROJECTION);
		expect(snapshot).toMatchObject({ status: { kind: 'synced' }, lastSyncedAt: NOW, character: PREVIOUS_STANDING, events: [], invalidSkills: [], unreadable: [], invalidRules: null });
		expect(snapshot.skills).toHaveLength(1);
		expect(snapshot.skills?.[0]).toMatchObject({ skill: { id: 'lector', unlocked: true, unlockedOn: '2026-11-01' }, xp: 20, standing: PREVIOUS_SKILL_STANDING, rank: null, requirements: [{ done: 2, total: 2, met: true }] });
	});
});

describe('SyncGame: the completions that stand, for "since your last visit" (game-ui S15)', () => {
	it('counts the history and the new rows once per transition, and writes the same rows as before', async () => {
		const history = [row({ habiticaId: 'h1', date: '2026-11-01' }), row({ habiticaId: 'h2', date: '2026-11-02' }), row({ habiticaId: 'h2', date: '2026-11-02', source: 'revert', xp: -10 })];
		const cuidador = skill({ id: 'cuidador', name: 'Cuidador', requirements: [] });
		const { sync, ledger, source } = setup({ skills: [owned(), cuidador], rows: history, tasks: [todo('a', { skills: ['lector', 'cuidador'] })] });

		const snapshot = await sync.execute();

		expect(snapshot.completedQuests).toBe(2);
		expect(ledger.appended.flat().map((paid) => [paid.habiticaId, paid.skill, paid.source, paid.n])).toEqual([
			['a', 'lector', 'complete', 1],
			['a', 'cuidador', 'complete', 1],
		]);
		expect(source.calls).toBe(1);
	});

	it('has no count before the first game sync, keeps it when a sync fails, and a rebuild counts the ledger again', async () => {
		const { sync, source, state, ledger } = setup({ skills: [owned()], tasks: [todo('a')] });
		expect(state.snapshot().completedQuests).toBeUndefined();

		const good = await sync.execute();
		source.failWith = new TaskSourceError('Offline', null, 'down');
		const failed = await sync.execute();
		await ledger.append([row({ habiticaId: 'later', date: TODAY })]);
		await sync.rebuild();

		expect(good.completedQuests).toBe(1);
		expect(failed.completedQuests).toBe(1);
		expect(state.snapshot().completedQuests).toBe(2);
	});
});

describe('SyncGame: the chronicle of deeds (game-ui S18)', () => {
	const escriba = skill({ id: 'escriba', name: 'Escriba', requirements: [] });
	const history = [
		row({ habiticaId: 'h1', task: 'One', date: '2026-10-30' }),
		row({ habiticaId: 'h2', task: 'Stretch', skill: null, kind: 'daily', date: '2026-11-01' }),
		row({ habiticaId: 'h2', task: 'Stretch', skill: null, kind: 'daily', date: '2026-11-01', xp: 5, source: 'streak' }),
		row({ habiticaId: 'h3', task: 'Three', date: '2026-11-02', xp: -10, source: 'revert' }),
		row({ habiticaId: 'h4', task: 'Ghost skill', skill: 'gone', date: '2026-11-02' }),
	];

	it('lists the last five deeds, newest first, with the names of their skills, from the one read of the ledger', async () => {
		const { sync, ledger, source } = setup({ skills: [owned(), escriba], rows: history, tasks: [todo('a', { title: 'Write today', skills: ['lector', 'escriba'] })] });
		const reads = vi.spyOn(ledger, 'readAll');

		const snapshot = await sync.execute();

		expect(snapshot.deeds).toEqual([
			{ date: '2026-11-03', task: 'Write today', xp: 10, source: 'complete', skills: [{ id: 'lector', name: 'Lector' }, { id: 'escriba', name: 'Escriba' }] },
			{ date: '2026-11-02', task: 'Ghost skill', xp: 10, source: 'complete', skills: [{ id: 'gone', name: 'gone' }] },
			{ date: '2026-11-02', task: 'Three', xp: -10, source: 'revert', skills: [{ id: 'lector', name: 'Lector' }] },
			{ date: '2026-11-01', task: 'Stretch', xp: 5, source: 'streak', skills: [] },
			{ date: '2026-11-01', task: 'Stretch', xp: 10, source: 'complete', skills: [] },
		]);
		expect(reads).toHaveBeenCalledTimes(1);
		expect(source.calls).toBe(1);
	});

	it('writes the same rows and notes as without the chronicle', async () => {
		const { sync, ledger, characters, skills } = setup({ skills: [owned(), escriba], rows: history, tasks: [todo('a', { title: 'Write today', skills: ['lector', 'escriba'] })] });

		await sync.execute();

		expect(ledger.appended).toEqual([
			[row({ habiticaId: 'a', task: 'Write today', xp: 10 }), row({ habiticaId: 'a', task: 'Write today', skill: 'escriba', xp: 10 })],
		]);
		expect(characters.saved).toEqual([{ ...PREVIOUS_CHARACTER, totalXp: 35, stats: { ...PREVIOUS_CHARACTER.stats, inteligencia: 0, disciplina: 1 }, gameStart: '2026-10-30' }]);
		expect(Object.fromEntries(skills.projections)).toEqual({
			lector: { unlocked: true, unlockedOn: '2026-11-01', level: 1, xp: 0, xpToNext: 100 },
			escriba: { unlocked: false, unlockedOn: null, level: 0, xp: 0, xpToNext: null },
		});
	});

	it('has none before the first game sync, keeps them when a sync fails, and a rebuild reads them from the ledger alone', async () => {
		const { sync, source, state } = setup({ skills: [owned()], rows: history.slice(0, 1), tasks: [todo('a')] });
		expect(state.snapshot().deeds).toBeUndefined();

		await sync.execute();
		const after = state.snapshot().deeds;
		source.failWith = new TaskSourceError('Offline', null, 'down');
		const failed = await sync.execute();
		await sync.rebuild();

		expect(after?.map((deed) => deed.task)).toEqual(['Task a', 'One']);
		expect(failed.deeds).toEqual(after);
		expect(state.snapshot().deeds?.map((deed) => deed.task)).toEqual(['Task a', 'One']);
	});
});
