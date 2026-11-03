import {
	LevelCurve,
	completedCampaignCount,
	completedQuestCount,
	evaluateUnlock,
	foldLedger,
	longestStreakBySkill,
	rankOf,
	recentRowsBySkill,
	resolveGameStart,
	resolveUnlock,
	rowsToAppend,
	skillStanding,
	taskPrice,
	type Campaign,
	type Character,
	type LedgerRow,
	type StatId,
	type UnlockEvidence,
} from '../domain';
import type {
	CampaignRepository,
	CharacterProjection,
	Clock,
	GameStateRepository,
	GameTaskSource,
	LedgerLoadResult,
	LedgerRepository,
	ObservedTask,
	RulesLoadResult,
	RulesRepository,
	SkillLoadResult,
	SkillRepository,
} from '../ports';
import { detectEvents, type GameEvent, type SkillChange } from './gameEvents';
import type { CharacterStanding, GameResult, GameSnapshot, GameState, QuestPrice, SkillEntry } from './GameState';
import { statusForFailure } from './statusForFailure';

export interface SyncGameDeps {
	readonly skills: SkillRepository;
	readonly ledger: LedgerRepository;
	readonly characters: GameStateRepository;
	readonly campaigns: CampaignRepository;
	readonly rules: RulesRepository;
	readonly source: GameTaskSource;
	readonly clock: Clock;
	readonly state: GameState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

/** What a rebuild did, for the command to answer with. */
export type RebuildOutcome =
	| {
			readonly kind: 'rebuilt';
			readonly level: number;
			readonly totalXp: number;
			/** `Character.md` was missing, so its `name` and `title` are empty now. */
			readonly createdCharacter: boolean;
			readonly unreadableRows: number;
	  }
	| { readonly kind: 'failed' };

/** Everything the game reads from the vault besides the character. */
interface VaultReads {
	readonly skills: SkillLoadResult;
	readonly ledger: LedgerLoadResult;
	readonly completedCampaigns: readonly Campaign[];
	readonly rules: RulesLoadResult;
}

/** What a list of rows amounts to under the rules. */
interface GameProjection {
	readonly character: CharacterStanding;
	readonly stats: Readonly<Record<StatId, number>>;
	readonly entries: readonly SkillEntry[];
	readonly events: readonly GameEvent[];
	readonly questPrices: ReadonlyMap<string, QuestPrice>;
}

/** How many ledger rows each skill keeps for its recent entries (game-ui S9). */
const RECENT_ENTRIES = 5;

/**
 * The game sync (M3): reads the vault and Habitica, appends to the ledger what changed in
 * Habitica, decides which skills unlock, and writes the derived fields back to `Character.md`
 * and to the skill notes. The ledger is the record and the notes are a projection of it; a
 * sync that fails half way is repaired by the next one, which plans the same rows again.
 * Neither `execute` nor `rebuild` ever rejects.
 *
 * Syncs and rebuilds take turns: an overlapping pair would read the same history and write
 * over each other, and two syncs would plan the same rows twice.
 */
export class SyncGame {
	private inFlight: Promise<GameSnapshot> | null = null;
	private turn: Promise<unknown> = Promise.resolve();
	/** The streaks the last sync saw: a rebuild cannot ask Habitica for them. */
	private lastStreaks: ReadonlyMap<string, number> = new Map();
	/** The tasks the last sync read, so a rebuild can price them by the rules it reads. */
	private lastObservations: readonly ObservedTask[] = [];

	constructor(private readonly deps: SyncGameDeps) {}

	/** Runs one sync, or returns the one already asked for. The state reads `syncing` as soon as this returns. */
	execute(): Promise<GameSnapshot> {
		if (this.inFlight === null) {
			this.deps.state.setStatus({ kind: 'syncing' });
			this.inFlight = this.inTurn(() => this.run()).finally(() => {
				this.inFlight = null;
			});
		}
		return this.inFlight;
	}

	/**
	 * Recomputes the notes from the ledger alone (S17): no Habitica and no new rows, so it works
	 * offline and without an account. It applies a changed curve at once and creates
	 * `Character.md` again if it is missing. It never starts a game that has not started.
	 */
	rebuild(): Promise<RebuildOutcome> {
		return this.inTurn(() => this.runRebuild());
	}

	private inTurn<T>(work: () => Promise<T>): Promise<T> {
		const run = this.turn.then(work);
		this.turn = run.catch(() => undefined);
		return run;
	}

	private async run(): Promise<GameSnapshot> {
		const { state, hasCredentials, clock, source, characters } = this.deps;
		state.setStatus({ kind: 'syncing' });
		if (!hasCredentials()) {
			state.setStatus({ kind: 'not-configured' });
			return state.snapshot();
		}

		let character: Character;
		let vault: VaultReads;
		try {
			// Without `Character.md` the game has nowhere to keep its state, so nothing else is read.
			const loaded = await characters.loadCharacter();
			if (loaded.kind === 'missing') {
				state.setStatus({ kind: 'no-character' });
				return state.snapshot();
			}
			character = loaded.character;
			vault = await this.readVault();
		} catch {
			state.setStatus({ kind: 'error' });
			return state.snapshot();
		}

		try {
			const observations = await source.fetchObservations(clock.today());
			await this.apply(character, vault, observations);
		} catch (error) {
			state.setStatus(statusForFailure(error));
		}
		return state.snapshot();
	}

	private async readVault(): Promise<VaultReads> {
		const { skills, ledger, campaigns, rules } = this.deps;
		const [skillLoad, ledgerLoad, completedCampaigns, rulesLoad] = await Promise.all([skills.list(), ledger.readAll(), campaigns.listCompleted(), rules.load()]);
		return { skills: skillLoad, ledger: ledgerLoad, completedCampaigns, rules: rulesLoad };
	}

	private async apply(character: Character, vault: VaultReads, observations: readonly ObservedTask[]): Promise<void> {
		const { ledger, characters, clock, state } = this.deps;
		const history = vault.ledger.rows;
		const gameStart = resolveGameStart(character.gameStart, history, clock.today());
		const newRows = rowsToAppend(history, observations, gameStart, vault.rules.rules.xp);
		const streaks = longestStreakBySkill(observations);
		const game = this.project(vault, [...history, ...newRows], streaks, observations);

		// The skill notes go first: they are the only place the day of an unlock is kept, and the
		// ledger rows can be planned again by the next sync, so a failure between the two writes
		// loses nothing that matters.
		await this.writeNotes(game, async () => {
			if (newRows.length > 0) await ledger.append(newRows);
			await characters.saveCharacter(characterProjection(game, gameStart, clock.now().toISOString()));
		});

		this.lastStreaks = streaks;
		this.lastObservations = observations;
		state.recordSuccess(gameResult(vault, game), clock.now());
	}

	private async runRebuild(): Promise<RebuildOutcome> {
		const { characters, clock, state } = this.deps;
		try {
			const loaded = await characters.loadCharacter();
			const vault = await this.readVault();
			const rows = vault.ledger.rows;
			const current = loaded.kind === 'found' ? loaded.character.gameStart : null;
			const gameStart = rows.length > 0 ? resolveGameStart(current, rows, clock.today()) : current;
			const game = this.project(vault, rows, this.lastStreaks, this.lastObservations);

			const projection = characterProjection(game, gameStart, null);
			await this.writeNotes(game, async () => {
				if (loaded.kind === 'missing') await characters.createCharacter(projection, clock.today());
				else if ((await characters.saveCharacter(projection)) === 'missing') throw new Error('Character.md disappeared during the rebuild');
			});

			state.recordRebuild(gameResult(vault, game));
			return { kind: 'rebuilt', level: game.character.level, totalXp: game.character.totalXp, createdCharacter: loaded.kind === 'missing', unreadableRows: vault.ledger.unreadable.length };
		} catch {
			return { kind: 'failed' };
		}
	}

	/**
	 * Decides the unlocks and turns `rows` into levels. Compared with the ledger as it was read, it also says what is new.
	 * It keeps each skill's last rows, and prices `observations` as the ledger would pay them.
	 */
	private project(vault: VaultReads, rows: readonly LedgerRow[], streaks: ReadonlyMap<string, number>, observations: readonly ObservedTask[]): GameProjection {
		const { rules } = vault.rules;
		const characterCurve = new LevelCurve(rules.characterCurve);
		const today = this.deps.clock.today();

		const decisions = vault.skills.skills.map((skill) => {
			const evidence: UnlockEvidence = {
				quests: completedQuestCount(rows, skill.id),
				campaigns: completedCampaignCount(vault.completedCampaigns, skill.id),
				habitStreak: streaks.get(skill.id) ?? 0,
			};
			return { skill, evidence, unlock: resolveUnlock(skill, evidence, today) };
		});

		const before = foldLedger(vault.ledger.rows, vault.skills.skills, rules);
		const after = foldLedger(
			rows,
			decisions.map(({ skill, unlock }) => ({ id: skill.id, stat: skill.stat, unlockedOn: unlock.unlockedOn })),
			rules,
		);

		const recent = recentRowsBySkill(rows, RECENT_ENTRIES);
		const entries: SkillEntry[] = [];
		const changes: SkillChange[] = [];
		for (const { skill, evidence, unlock } of decisions) {
			const xp = after.skillXp[skill.id] ?? 0;
			const standing = skillStanding(unlock.unlocked, xp, rules);
			const current = { ...skill, unlocked: unlock.unlocked, unlockedOn: unlock.unlockedOn };
			entries.push({
				skill: current,
				xp,
				standing,
				rank: rankOf(current, standing.rankIndex),
				requirements: evaluateUnlock(skill.requirements, evidence).items,
				recent: (recent.get(skill.id) ?? []).map(({ date, task, xp: rowXp, source }) => ({ date, task, xp: rowXp, source })),
			});
			changes.push({ skill: current, justUnlocked: unlock.justUnlocked, before: skillStanding(skill.unlocked, before.skillXp[skill.id] ?? 0, rules), after: standing });
		}

		const character = { ...characterCurve.progressFor(after.characterXp), totalXp: after.characterXp };
		const events = detectEvents(characterCurve.levelFor(before.characterXp), character.level, changes);
		return { character, stats: after.stats, entries, events, questPrices: questPrices(observations, vault) };
	}

	/**
	 * Writes the skill notes, then `rest`. A note already written will never report its unlock
	 * again, so when anything after it fails the announcement is kept here; a level-up needs no
	 * such care, because the next run plans the same rows and reports it.
	 */
	private async writeNotes(game: GameProjection, rest: () => Promise<void>): Promise<void> {
		const written = new Set<string>();
		try {
			for (const { skill, standing, xp } of game.entries) {
				await this.deps.skills.writeProjection(skill.id, { unlocked: skill.unlocked, unlockedOn: skill.unlockedOn, level: standing.level, xp, xpToNext: standing.xpToNext });
				written.add(skill.id);
			}
			await rest();
		} catch (error) {
			this.deps.state.addEvents(game.events.filter((event) => event.kind === 'skill-unlocked' && written.has(event.skillId)));
			throw error;
		}
	}
}

function characterProjection(game: GameProjection, gameStart: string | null, lastSync: string | null): CharacterProjection {
	const { level, totalXp, xpToNext } = game.character;
	return { level, totalXp, xpToNext, stats: game.stats, gameStart, lastSync };
}

function gameResult(vault: VaultReads, game: GameProjection): GameResult {
	return {
		character: game.character,
		skills: game.entries,
		events: game.events,
		invalidSkills: vault.skills.invalid,
		unreadable: vault.ledger.unreadable,
		invalidRules: vault.rules.invalid,
		questPrices: game.questPrices,
	};
}

/** Every task read, priced by the XP table of the rules with `taskPrice`, the function the ledger rows are built from. */
function questPrices(observations: readonly ObservedTask[], vault: VaultReads): Map<string, QuestPrice> {
	const names = new Map(vault.skills.skills.map((skill) => [skill.id, skill.name]));
	return new Map(
		observations.map((observation) => {
			const { xp, skills } = taskPrice(observation, vault.rules.rules.xp);
			return [observation.habiticaId, { xp, skills: skills.map((id) => ({ id, name: names.get(id) ?? id })) }];
		}),
	);
}
