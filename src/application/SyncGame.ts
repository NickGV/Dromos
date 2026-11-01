import {
	CHARACTER_CURVE,
	LevelCurve,
	completedCampaignCount,
	completedQuestCount,
	evaluateUnlock,
	foldLedger,
	longestStreakBySkill,
	rankOf,
	resolveGameStart,
	resolveUnlock,
	rowsToAppend,
	skillStanding,
	type Campaign,
	type Character,
	type UnlockEvidence,
} from '../domain';
import type {
	CampaignRepository,
	Clock,
	GameStateRepository,
	GameTaskSource,
	LedgerLoadResult,
	LedgerRepository,
	ObservedTask,
	SkillLoadResult,
	SkillRepository,
} from '../ports';
import { detectEvents, type SkillChange } from './gameEvents';
import type { GameSnapshot, GameState, SkillEntry } from './GameState';
import { statusForFailure } from './statusForFailure';

export interface SyncGameDeps {
	readonly skills: SkillRepository;
	readonly ledger: LedgerRepository;
	readonly characters: GameStateRepository;
	readonly campaigns: CampaignRepository;
	readonly source: GameTaskSource;
	readonly clock: Clock;
	readonly state: GameState;
	/** True when both the Habitica user ID and token are set. */
	readonly hasCredentials: () => boolean;
}

interface VaultReads {
	readonly character: Character;
	readonly skills: SkillLoadResult;
	readonly ledger: LedgerLoadResult;
	readonly completedCampaigns: readonly Campaign[];
}

const characterCurve = new LevelCurve(CHARACTER_CURVE);

/**
 * The game sync (M3): reads the vault and Habitica, appends to the ledger what changed in
 * Habitica, decides which skills unlock, and writes the derived fields back to `Character.md`
 * and to the skill notes. The ledger is the record: the notes are a projection of it, so a
 * sync that fails half way is repaired by the next one. Never rejects.
 *
 * Only one sync runs at a time: two overlapping ones would read the same history and plan
 * the same rows twice.
 */
export class SyncGame {
	private inFlight: Promise<GameSnapshot> | null = null;

	constructor(private readonly deps: SyncGameDeps) {}

	/** Runs one sync, or returns the one already running. The state reads `syncing` as soon as this returns. */
	execute(): Promise<GameSnapshot> {
		this.inFlight ??= this.run().finally(() => {
			this.inFlight = null;
		});
		return this.inFlight;
	}

	private async run(): Promise<GameSnapshot> {
		const { state, hasCredentials, clock, source } = this.deps;
		state.setStatus({ kind: 'syncing' });
		if (!hasCredentials()) {
			state.setStatus({ kind: 'not-configured' });
			return state.snapshot();
		}

		let vault: VaultReads | null;
		try {
			vault = await this.readVault();
		} catch {
			state.setStatus({ kind: 'error' });
			return state.snapshot();
		}
		if (vault === null) {
			state.setStatus({ kind: 'no-character' });
			return state.snapshot();
		}

		try {
			const observations = await source.fetchObservations(clock.today());
			await this.apply(vault, observations);
		} catch (error) {
			state.setStatus(statusForFailure(error));
		}
		return state.snapshot();
	}

	/** `null` when `Character.md` is missing: the game has nowhere to keep its state, so nothing else is read. */
	private async readVault(): Promise<VaultReads | null> {
		const { characters, skills, ledger, campaigns } = this.deps;
		const loaded = await characters.loadCharacter();
		if (loaded.kind === 'missing') return null;
		const [skillLoad, ledgerLoad, completedCampaigns] = await Promise.all([skills.list(), ledger.readAll(), campaigns.listCompleted()]);
		return { character: loaded.character, skills: skillLoad, ledger: ledgerLoad, completedCampaigns };
	}

	private async apply(vault: VaultReads, observations: readonly ObservedTask[]): Promise<void> {
		const { ledger, skills, characters, clock, state } = this.deps;
		const today = clock.today();
		const history = vault.ledger.rows;
		const gameStart = resolveGameStart(vault.character.gameStart, history, today);

		const newRows = rowsToAppend(history, observations, gameStart);
		if (newRows.length > 0) await ledger.append(newRows);
		const rows = [...history, ...newRows];

		const streaks = longestStreakBySkill(observations);
		const decisions = vault.skills.skills.map((skill) => {
			const evidence: UnlockEvidence = {
				quests: completedQuestCount(rows, skill.id),
				campaigns: completedCampaignCount(vault.completedCampaigns, skill.id),
				habitStreak: streaks.get(skill.id) ?? 0,
			};
			return { skill, evidence, unlock: resolveUnlock(skill, evidence, today) };
		});

		const before = foldLedger(history, vault.skills.skills);
		const after = foldLedger(
			rows,
			decisions.map(({ skill, unlock }) => ({ id: skill.id, stat: skill.stat, unlockedOn: unlock.unlockedOn })),
		);

		const entries: SkillEntry[] = [];
		const changes: SkillChange[] = [];
		for (const { skill, evidence, unlock } of decisions) {
			const xp = after.skillXp[skill.id] ?? 0;
			const standing = skillStanding(unlock.unlocked, xp);
			const current = { ...skill, unlocked: unlock.unlocked, unlockedOn: unlock.unlockedOn };
			entries.push({ skill: current, xp, standing, rank: rankOf(current, standing.rankIndex), requirements: evaluateUnlock(skill.requirements, evidence).items });
			changes.push({ skill: current, justUnlocked: unlock.justUnlocked, before: skillStanding(skill.unlocked, before.skillXp[skill.id] ?? 0), after: standing });
		}

		const character = { ...characterCurve.progressFor(after.characterXp), totalXp: after.characterXp };
		const events = detectEvents(characterCurve.levelFor(before.characterXp), character.level, changes);

		for (const { skill, standing, xp } of entries) {
			await skills.writeProjection(skill.id, { unlocked: skill.unlocked, unlockedOn: skill.unlockedOn, level: standing.level, xp, xpToNext: standing.xpToNext });
		}
		await characters.saveCharacter({
			level: character.level,
			totalXp: character.totalXp,
			xpToNext: character.xpToNext,
			stats: after.stats,
			gameStart,
			lastSync: today,
		});

		state.recordSuccess({ character, skills: entries, events, invalidSkills: vault.skills.invalid, unreadable: vault.ledger.unreadable }, clock.now());
	}
}
