import type { LedgerSource, Skill, SkillRank, SkillStanding, RequirementProgress } from '../domain';
import type { InvalidRules, InvalidSkillNote, UnreadableLedgerEvent } from '../ports';
import type { GameEvent } from './gameEvents';
import type { PendingOrFailedStatus, SyncStatus } from './QuestState';

/** `no-character` means `Character.md` is missing, so the game has nowhere to keep its state. */
export type GameStatus = SyncStatus | { readonly kind: 'no-character' };
export type GamePendingOrFailedStatus = PendingOrFailedStatus | { readonly kind: 'no-character' };

export interface CharacterStanding {
	readonly level: number;
	readonly totalXp: number;
	readonly xpIntoLevel: number;
	readonly xpToNext: number;
}

/** One ledger row of a skill, as its recent entries list it. */
export interface RecentEntry {
	/** Local date as `YYYY-MM-DD`. */
	readonly date: string;
	readonly task: string;
	/** Signed: a `revert` is negative. */
	readonly xp: number;
	readonly source: LedgerSource;
}

/** One skill as the Skills page shows it. `skill` already carries the unlock decided by the sync. */
export interface SkillEntry {
	readonly skill: Skill;
	readonly xp: number;
	readonly standing: SkillStanding;
	/** The rank the skill holds, or `null` while locked. */
	readonly rank: SkillRank | null;
	readonly requirements: readonly RequirementProgress[];
	/** The skill's last ledger rows, newest first (at most five); empty when it has none. */
	readonly recent: readonly RecentEntry[];
}

/** A skill a quest feeds: the name of its note, or its id when the vault has no note for it. */
export interface SkillRef {
	readonly id: string;
	readonly name: string;
}

/**
 * One deed of the chronicle (game-ui S18): one transition of a Habitica task in the ledger, its
 * rows grouped with all their skills.
 */
export interface DeedEntry {
	/** Local date as `YYYY-MM-DD`. */
	readonly date: string;
	readonly task: string;
	/** Signed, as the character counts it once: a `revert` is negative, and so is a streak bonus taken back. */
	readonly xp: number;
	readonly source: LedgerSource;
	/** In the order the rows were written; empty for a task without skill. */
	readonly skills: readonly SkillRef[];
}

/** What completing one Habitica task writes to the ledger, priced the way the ledger prices it (game-ui S6). */
export interface QuestPrice {
	/** The XP of each row; the character counts it once. */
	readonly xp: number;
	/** Empty when the task has no skill tag: character XP only. */
	readonly skills: readonly SkillRef[];
}

export interface GameResult {
	readonly character: CharacterStanding;
	readonly skills: readonly SkillEntry[];
	/** What this sync produced; they join the ones not dismissed yet. */
	readonly events: readonly GameEvent[];
	readonly invalidSkills: readonly InvalidSkillNote[];
	readonly unreadable: readonly UnreadableLedgerEvent[];
	readonly invalidRules: InvalidRules | null;
	/** Habitica task id to its price, for every task the last game sync read. */
	readonly questPrices: ReadonlyMap<string, QuestPrice>;
	/** Task completions in the ledger that still stand: completions less reverts (game-ui S15). */
	readonly completedQuests: number;
	/** The last deeds of the ledger, newest first (at most five) (game-ui S18). */
	readonly deeds: readonly DeedEntry[];
}

/** Immutable view of the game; every change produces a new object. */
export interface GameSnapshot {
	readonly status: GameStatus;
	readonly lastSyncedAt: Date | null;
	/** `null` before the first successful sync. */
	readonly character: CharacterStanding | null;
	readonly skills: readonly SkillEntry[] | null;
	/** Events waiting to be shown; they stay until `dismissEvents`. */
	readonly events: readonly GameEvent[];
	readonly invalidSkills: readonly InvalidSkillNote[];
	readonly unreadable: readonly UnreadableLedgerEvent[];
	readonly invalidRules: InvalidRules | null;
	/**
	 * Habitica task id to its price, for the tasks the last game sync read; absent until the game
	 * first records a result. A task missing from it has no known price yet.
	 */
	readonly questPrices?: ReadonlyMap<string, QuestPrice>;
	/**
	 * Task completions in the ledger that still stand, completions less reverts, as the last game
	 * result counted them; absent until the game first records a result (game-ui S15).
	 */
	readonly completedQuests?: number;
	/**
	 * The last deeds of the ledger, newest first, as the last game result read them; absent until
	 * the game first records a result (game-ui S18).
	 */
	readonly deeds?: readonly DeedEntry[];
}

const INITIAL: GameSnapshot = { status: { kind: 'idle' }, lastSyncedAt: null, character: null, skills: null, events: [], invalidSkills: [], unreadable: [], invalidRules: null };

/** Session-scoped game state, held in memory only; the vault is the record. */
export class GameState {
	private current: GameSnapshot = INITIAL;
	/** Events no toast has covered yet. Closing the banner does not touch them. */
	private unannounced: readonly GameEvent[] = [];

	snapshot(): GameSnapshot {
		return this.current;
	}

	recordSuccess(result: GameResult, syncedAt: Date): void {
		this.record(result, { kind: 'synced' }, syncedAt);
	}

	/**
	 * A rebuild read only the vault, so the time of the last sync stands, and a failure that sync
	 * reported no longer describes the notes. A sync waiting its turn still reads `syncing`.
	 */
	recordRebuild(result: GameResult): void {
		const { status, lastSyncedAt } = this.current;
		this.record(result, status.kind === 'synced' || status.kind === 'syncing' ? status : { kind: 'idle' }, lastSyncedAt);
	}

	private record(result: GameResult, status: GameStatus, lastSyncedAt: Date | null): void {
		this.unannounced = [...this.unannounced, ...result.events];
		this.current = {
			status,
			lastSyncedAt,
			character: result.character,
			skills: [...result.skills],
			events: [...this.current.events, ...result.events],
			invalidSkills: [...result.invalidSkills],
			unreadable: [...result.unreadable],
			invalidRules: result.invalidRules,
			questPrices: result.questPrices,
			completedQuests: result.completedQuests,
			deeds: result.deeds,
		};
	}

	/** Changes only the status; everything else stays as the last sync left it. */
	setStatus(status: GamePendingOrFailedStatus): void {
		this.current = { ...this.current, status };
	}

	/** Events worth showing although the run that produced them failed. */
	addEvents(events: readonly GameEvent[]): void {
		this.unannounced = [...this.unannounced, ...events];
		this.current = { ...this.current, events: [...this.current.events, ...events] };
	}

	/** The events not handed over yet. Each comes out once, so a toast is never repeated. */
	takeAnnouncements(): readonly GameEvent[] {
		const events = this.unannounced;
		this.unannounced = [];
		return events;
	}

	/** The banner was closed. */
	dismissEvents(): void {
		this.current = { ...this.current, events: [] };
	}
}
