import type { Checklist } from '../quest/Quest';

/** Lifecycle status of work notes (ADR-012). Dromos never reads knowledge maturity. */
export type LifecycleStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';

export type Priority = 'high' | 'medium' | 'low';

/** A project is an `index` note; a research is a `research` note (Q023). */
export type CampaignKind = 'project' | 'research';

export interface Phase {
	readonly id: string;
	readonly name: string;
	readonly status: LifecycleStatus;
}

/**
 * A project task (an entry of `tasks[]`) or a research session. Completion is
 * resolved outside the domain: from Habitica for projects, from the session
 * note for research.
 */
export interface CampaignTask {
	readonly title: string;
	/** Id of a `Phase`, or `null` when the task belongs to none. */
	readonly phase: string | null;
	/** Habitica task id; `null` while the task has not been sent to Habitica. */
	readonly habiticaId: string | null;
	/** Skill ids that override the campaign skills when not empty. */
	readonly skills: readonly string[];
	readonly resources: readonly string[];
	readonly completed: boolean;
	/** Local completion date as `YYYY-MM-DD`, or `null` when unknown. */
	readonly completedOn: string | null;
	/** Its subtasks in Habitica, once Habitica has answered; absent when it has none (missions S2). */
	readonly checklist?: Checklist;
}

/**
 * A habit a campaign asks to build (S8): a daily Habitica tracks, with a target number of days.
 * Strict: its progress is Habitica's streak, which one missed day sends back to zero.
 */
export interface CampaignHabit {
	readonly title: string;
	/** Days of streak that build the habit. */
	readonly days: number;
	/** Skill ids of the habit; empty means the campaign's. */
	readonly skills: readonly string[];
	/** Habitica daily id; `null` while the habit has not been sent to Habitica. */
	readonly habiticaId: string | null;
	/** Current streak of its daily once Habitica has answered; `null` until then or while unsent. */
	readonly streak: number | null;
}

export interface Campaign {
	readonly kind: CampaignKind;
	/** Vault path of the note, used to open it. */
	readonly path: string;
	readonly title: string;
	readonly status: LifecycleStatus;
	readonly priority: Priority;
	/** Wikilink text of the area, or `null`. */
	readonly area: string | null;
	/** Skill ids the campaign trains; the default of the tasks that declare none. Empty when it has none. */
	readonly skills: readonly string[];
	/** Local date as `YYYY-MM-DD`, or `null`. */
	readonly deadline: string | null;
	/** Per-campaign stale threshold in days, or `null` to use the plugin setting. */
	readonly staleAfterDays: number | null;
	/** Local creation date as `YYYY-MM-DD`. */
	readonly created: string;
	readonly phases: readonly Phase[];
	readonly tasks: readonly CampaignTask[];
	/** Projects only; a research has none. */
	readonly habits: readonly CampaignHabit[];
}

/** Progress as a count plus a ratio in `[0, 1]`, never `NaN`. */
export interface Progress {
	readonly done: number;
	readonly total: number;
	readonly ratio: number;
}
