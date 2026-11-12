import { describe, expect, it } from 'vitest';
import { LoadAvatar, type LoadAvatarDeps } from '../../src/application/LoadAvatar';
import type { Book, Campaign, Character, LedgerRow, Skill } from '../../src/domain';
import { DEFAULT_RULES } from '../../src/domain/rules/GameRules';
import type { CharacterLoadResult, RulesLoadResult } from '../../src/ports';
import { campaign } from '../domain/campaign/campaignFixtures';
import { row } from '../domain/ledger/ledgerFixtures';
import { skill } from '../domain/skill/skillFixtures';
import { aBook, aReflection } from '../fakes/books';
import { FixedClock } from '../fakes/FixedClock';
import { InMemoryBookRepository } from '../fakes/InMemoryBookRepository';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';
import { InMemoryGameStateRepository } from '../fakes/InMemoryGameStateRepository';
import { InMemoryLedgerRepository } from '../fakes/InMemoryLedgerRepository';
import { InMemoryRulesRepository } from '../fakes/InMemoryRulesRepository';
import { InMemorySkillRepository } from '../fakes/InMemorySkillRepository';

const TODAY = '2026-11-12';

function character(overrides: Partial<Character> = {}): CharacterLoadResult {
	const stats = { fuerza: 0, vitalidad: 0, inteligencia: 0, sabiduria: 0, espiritu: 0, disciplina: 0 };
	return { kind: 'found', character: { name: 'Nico', title: '', level: 1, totalXp: 0, xpIntoLevel: 0, xpToNext: 100, stats, gameStart: '2026-10-01', ...overrides } };
}

function earned(id: string, unlockedOn = '2026-10-02'): Skill {
	return skill({ id, name: id, habiticaTag: `skill/${id}`, unlocked: true, unlockedOn });
}

/** One completed to-do of `skill` after every unlock above, worth `xp`. */
function deed(skillId: string, xp: number, n = 1): LedgerRow {
	return row({ habiticaId: `${skillId}-${n}`, task: `${skillId} ${n}`, skill: skillId, xp, date: '2026-11-01', n });
}

function finished(title: string, written = true): Book {
	return aBook({ path: `03 - Areas/Bibliotheke/${title}.md`, title, status: 'completed', finished: '2026-11-01', reflection: aReflection(written ? ['about', 'kept', 'changes', 'connects'] : []) });
}

function completedCampaign(title: string): Campaign {
	return campaign({ path: `02 - Projects/${title}/README.md`, title, status: 'completed' });
}

interface Vault {
	readonly character?: CharacterLoadResult;
	readonly skills?: readonly Skill[];
	readonly rows?: readonly LedgerRow[];
	readonly campaigns?: readonly Campaign[];
	readonly books?: readonly Book[];
	readonly rules?: RulesLoadResult;
}

function deps(vault: Vault = {}): LoadAvatarDeps {
	return {
		characters: new InMemoryGameStateRepository(vault.character ?? character()),
		skills: new InMemorySkillRepository(vault.skills ?? []),
		ledger: new InMemoryLedgerRepository(vault.rows ?? []),
		campaigns: new InMemoryCampaignRepository([], vault.campaigns ?? []),
		books: new InMemoryBookRepository(vault.books ?? []),
		rules: new InMemoryRulesRepository(vault.rules),
		clock: new FixedClock(new Date('2026-11-12T15:00:00Z'), TODAY),
	};
}

/** A disciple's vault: level 9, 42 days on the road, three earned skills, one campaign and five books finished. */
const DISCIPLE: Vault = {
	character: character({ level: 9, gameStart: '2026-10-01' }),
	skills: [earned('atleta'), earned('cronista'), earned('lector'), skill({ id: 'mayordomo', habiticaTag: 'skill/mayordomo' })],
	rows: [deed('lector', 100), deed('lector', 50, 2), deed('cronista', 50), deed('mayordomo', 500)],
	campaigns: [completedCampaign('Kairos')],
	books: [finished('Uno'), finished('Dos'), finished('Tres'), finished('Cuatro'), finished('Cinco', false), aBook({ title: 'Seis', status: 'active' }), aBook({ title: 'Siete' })],
};

function rejecting<T extends object>(target: T, method: keyof T): T {
	return Object.assign(Object.create(target) as T, { [method]: () => Promise.reject(new Error('disk')) });
}

describe('LoadAvatar: the stage from the vault (M11 S1)', () => {
	it('reads the level, the days since game_start, the earned skills, the finished campaigns and books', async () => {
		const avatar = await new LoadAvatar(deps(DISCIPLE)).execute();

		expect(avatar).toEqual({
			stage: 'disciple',
			skills: [
				{ id: 'lector', level: 2, xp: 150 },
				{ id: 'cronista', level: 1, xp: 50 },
				{ id: 'atleta', level: 1, xp: 0 },
			],
		});
	});

	it('a book counts once finished, its reflection written or not; one being read or planned does not', async () => {
		const books = DISCIPLE.books?.filter((book) => book.title !== 'Uno');

		expect((await new LoadAvatar(deps({ ...DISCIPLE, books })).execute()).stage).toBe('apprentice');
	});

	it('a campaign counts once finished', async () => {
		expect((await new LoadAvatar(deps({ ...DISCIPLE, campaigns: [] })).execute()).stage).toBe('pilgrim');
	});

	it('a locked skill is not earned, whatever its rows say', async () => {
		const skills = DISCIPLE.skills?.filter((entry) => entry.id !== 'atleta');

		const avatar = await new LoadAvatar(deps({ ...DISCIPLE, skills })).execute();

		expect(avatar.stage).toBe('apprentice');
		expect(avatar.skills.map(({ id }) => id)).toEqual(['lector', 'cronista']);
	});

	it('counts the days on the road from game_start to today', async () => {
		const wayfarer = { level: 3 };

		expect((await new LoadAvatar(deps({ character: character({ ...wayfarer, gameStart: '2026-10-13' }) })).execute()).stage).toBe('wayfarer');
		expect((await new LoadAvatar(deps({ character: character({ ...wayfarer, gameStart: '2026-10-14' }) })).execute()).stage).toBe('runner');
	});

	it('before the first game sync there is no game_start, so no day on the road yet', async () => {
		expect((await new LoadAvatar(deps({ character: character({ level: 3, gameStart: null }) })).execute()).stage).toBe('runner');
	});

	it('plays by the stages and the rank levels of Rules.md', async () => {
		const traveller: Vault = {
			...DISCIPLE,
			character: character({ level: 11, gameStart: '2026-10-01' }),
			skills: [earned('atleta'), earned('cronista'), earned('lector'), earned('mayordomo')],
		};
		const rules = (overrides: Partial<typeof DEFAULT_RULES>): RulesLoadResult => ({ rules: { ...DEFAULT_RULES, ...overrides }, invalid: null });

		// Lector (level 2) and mayordomo (level 3) hold no rank 2 by default, which starts at level 5; they do when it starts at level 2.
		expect((await new LoadAvatar(deps(traveller)).execute()).stage).toBe('disciple');
		expect((await new LoadAvatar(deps({ ...traveller, rules: rules({ rankLevels: [1, 2, 3, 4, 5] }) })).execute()).stage).toBe('traveller');
		expect((await new LoadAvatar(deps({ ...traveller, rules: rules({ stages: { ...DEFAULT_RULES.stages, disciple: { ...DEFAULT_RULES.stages.disciple, books: 6 } } }) })).execute()).stage).toBe('apprentice');
	});

	it('measures the skills by the skill curve of Rules.md', async () => {
		const avatar = await new LoadAvatar(deps({ ...DISCIPLE, rules: { rules: { ...DEFAULT_RULES, skillCurve: { base: 10, exponent: 1 } }, invalid: null } })).execute();

		expect(avatar.skills[0]).toEqual({ id: 'lector', level: 6, xp: 150 });
	});
});

describe('LoadAvatar: the earned skills, highest first (M11 S1)', () => {
	it('by level, then by XP, then by id', async () => {
		const skills = [earned('reposo'), earned('atleta'), earned('maestro'), earned('lector'), earned('escriba')];
		const rows = [deed('maestro', 120), deed('lector', 30), deed('escriba', 30), deed('reposo', 60)];

		const avatar = await new LoadAvatar(deps({ skills, rows })).execute();

		expect(avatar.skills).toEqual([
			{ id: 'maestro', level: 2, xp: 120 },
			{ id: 'reposo', level: 1, xp: 60 },
			{ id: 'escriba', level: 1, xp: 30 },
			{ id: 'lector', level: 1, xp: 30 },
			{ id: 'atleta', level: 1, xp: 0 },
		]);
	});

	it('counts only the XP earned after the skill was', async () => {
		const avatar = await new LoadAvatar(deps({ skills: [earned('lector', '2026-11-05')], rows: [deed('lector', 80)] })).execute();

		expect(avatar.skills).toEqual([{ id: 'lector', level: 1, xp: 0 }]);
	});
});

describe('LoadAvatar: missing evidence (M11 S1)', () => {
	it('with no Character.md the stage is the runner; the earned skills still show', async () => {
		const avatar = await new LoadAvatar(deps({ ...DISCIPLE, character: { kind: 'missing', path: 'Dromos/Character.md' } })).execute();

		expect(avatar.stage).toBe('runner');
		expect(avatar.skills.map(({ id }) => id)).toEqual(['lector', 'cronista', 'atleta']);
	});

	it('each read answers for itself: one that fails counts as no evidence', async () => {
		const vault = deps(DISCIPLE);

		expect((await new LoadAvatar({ ...vault, books: rejecting(vault.books, 'list') }).execute()).stage).toBe('apprentice');
		expect((await new LoadAvatar({ ...vault, campaigns: rejecting(vault.campaigns, 'listCompleted') }).execute()).stage).toBe('pilgrim');
		expect((await new LoadAvatar({ ...vault, characters: rejecting(vault.characters, 'loadCharacter') }).execute()).stage).toBe('runner');
		expect(await new LoadAvatar({ ...vault, ledger: rejecting(vault.ledger, 'readAll') }).execute()).toEqual({
			stage: 'disciple',
			skills: [
				{ id: 'atleta', level: 1, xp: 0 },
				{ id: 'cronista', level: 1, xp: 0 },
				{ id: 'lector', level: 1, xp: 0 },
			],
		});
		expect(await new LoadAvatar({ ...vault, skills: rejecting(vault.skills, 'list') }).execute()).toEqual({ stage: 'wayfarer', skills: [] });
	});

	it('rules that cannot be read play by the defaults', async () => {
		const vault = deps(DISCIPLE);

		expect((await new LoadAvatar({ ...vault, rules: rejecting(vault.rules, 'load') }).execute()).stage).toBe('disciple');
	});

	it('never rejects: with nothing readable it is the runner carrying nothing', async () => {
		const vault = deps(DISCIPLE);
		const blind: LoadAvatarDeps = {
			...vault,
			characters: rejecting(vault.characters, 'loadCharacter'),
			skills: rejecting(vault.skills, 'list'),
			ledger: rejecting(vault.ledger, 'readAll'),
			campaigns: rejecting(vault.campaigns, 'listCompleted'),
			books: rejecting(vault.books, 'list'),
			rules: rejecting(vault.rules, 'load'),
		};

		await expect(new LoadAvatar(blind).execute()).resolves.toEqual({ stage: 'runner', skills: [] });
	});
});
