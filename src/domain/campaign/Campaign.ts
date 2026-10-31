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
	/** Overrides the campaign skill when set. */
	readonly skill: string | null;
	readonly resources: readonly string[];
	readonly completed: boolean;
	/** Local completion date as `YYYY-MM-DD`, or `null` when unknown. */
	readonly completedOn: string | null;
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
	/** Default skill of the tasks (projects), or `null`. */
	readonly skill: string | null;
	/** Local date as `YYYY-MM-DD`, or `null`. */
	readonly deadline: string | null;
	/** Per-campaign stale threshold in days, or `null` to use the plugin setting. */
	readonly staleAfterDays: number | null;
	/** Local creation date as `YYYY-MM-DD`. */
	readonly created: string;
	readonly phases: readonly Phase[];
	readonly tasks: readonly CampaignTask[];
}

/** Progress as a count plus a ratio in `[0, 1]`, never `NaN`. */
export interface Progress {
	readonly done: number;
	readonly total: number;
	readonly ratio: number;
}
