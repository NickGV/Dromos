import type { Skill, SkillRank, SkillStanding, RequirementProgress } from '../domain';
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

/** One skill as the Skills page shows it. `skill` already carries the unlock decided by the sync. */
export interface SkillEntry {
	readonly skill: Skill;
	readonly xp: number;
	readonly standing: SkillStanding;
	/** The rank the skill holds, or `null` while locked. */
	readonly rank: SkillRank | null;
	readonly requirements: readonly RequirementProgress[];
}

export interface GameResult {
	readonly character: CharacterStanding;
	readonly skills: readonly SkillEntry[];
	/** What this sync produced; they join the ones not dismissed yet. */
	readonly events: readonly GameEvent[];
	readonly invalidSkills: readonly InvalidSkillNote[];
	readonly unreadable: readonly UnreadableLedgerEvent[];
	readonly invalidRules: InvalidRules | null;
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
	 * reported no longer describes the notes.
	 */
	recordRebuild(result: GameResult): void {
		const { status, lastSyncedAt } = this.current;
		this.record(result, status.kind === 'synced' ? status : { kind: 'idle' }, lastSyncedAt);
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
		};
	}

	/** Changes only the status; everything else stays as the last sync left it. */
	setStatus(status: GamePendingOrFailedStatus): void {
		this.current = { ...this.current, status };
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
