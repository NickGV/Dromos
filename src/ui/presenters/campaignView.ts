import type { CampaignSnapshot, CampaignIssue } from '../../application';
import { plural, type Translator } from '../../i18n';
import { campaignProgress, daysSince, habitProgress, isMission, isStale, lastActivity, nextAction, phaseProgress, WEEKDAYS, type Campaign, type CampaignHabit, type Checklist, type Progress, type Weekday } from '../../domain';
import { weekdayShort } from './dates';

/** How one task is shown in a campaign card: `deleted` when Habitica confirmed it no longer has it (ADR-021). */
export type TaskRowState = 'completed' | 'pending' | 'unsent' | 'missing' | 'deleted';

export interface TaskRowView {
	readonly title: string;
	readonly state: TaskRowState;
	/** Only a project task that was never sent to Habitica can be sent. */
	readonly canSend: boolean;
	/** Only a task Habitica confirmed deleted can be sent again, and only while Habitica is set up (ADR-021). */
	readonly canResend: boolean;
	/**
	 * The id of the task's phase as stored, matching `PhaseSegmentView.id`; `null` when it has none.
	 * `campaignCardView` always sets it; it is optional only so rows built by hand stay valid.
	 */
	readonly phase?: string | null;
	/** Its subtasks, present only when they make it a mission (missions S2). */
	readonly mission?: Checklist;
}

/** How one daily is shown in a campaign card (S8, ADR-021). A routine, with no target, is never `built`. */
export type HabitRowState = 'unsent' | 'missing' | 'deleted' | 'tracking' | 'built';

export interface HabitRowView {
	readonly title: string;
	readonly state: HabitRowState;
	/** Only a habit that was never sent to Habitica can be sent. */
	readonly canSend: boolean;
	/** Only a daily Habitica confirmed deleted can be sent again, and only while Habitica is set up (ADR-021). */
	readonly canResend: boolean;
	/** "lun · mié · vie", or "Todos los días" for a daily due every day (ADR-021). */
	readonly schedule: string;
	/** "5 ítems" for a daily with a checklist; `null` without one (ADR-021). */
	readonly items: string | null;
	/** Streak over target days, whole percent; `null` for a routine, which has no target and so no bar. */
	readonly progress: { readonly done: number; readonly total: number; readonly percent: number } | null;
	readonly text: string;
}

/** Where a phase stands on the road of its campaign. */
export type PhaseSegmentState = 'done' | 'open' | 'ahead';

/** One phase drawn as a stretch of road: completed, the open one with its progress, or still ahead. */
export interface PhaseSegmentView {
	/** The phase id, which the task rows name in `phase`. */
	readonly id: string;
	readonly name: string;
	readonly state: PhaseSegmentState;
	/** Whole percent, 0..100. */
	readonly percent: number;
}

/** One campaign as `CampaignCard` renders it (S5). */
export interface CampaignCardView {
	readonly path: string;
	readonly title: string;
	readonly kindLabel: string;
	/** Set when the campaign is stale, with the days since its last completed task. */
	readonly stale: { readonly days: number } | null;
	/** Projects: the open phase and its progress. Research: phases done over phases. */
	readonly chip: string;
	/** The next task (project) or phase (research), or `null` when nothing is left. */
	readonly next: string | null;
	readonly progress: { readonly ratio: number; readonly percent: number };
	/** Every phase in order; empty for a campaign without phases. */
	readonly segments: readonly PhaseSegmentView[];
	readonly tasks: readonly TaskRowView[];
	readonly habits: readonly HabitRowView[];
	readonly warnings: readonly string[];
	/** The delivery date as stored (`YYYY-MM-DD`), or `null` when the campaign has none. */
	readonly deadline: string | null;
	/** Whole days from today to the deadline, 0 on the day and negative once past; `null` without a deadline. */
	readonly daysLeft: number | null;
}

export interface CampaignViewContext {
	/** `Clock.today()`. */
	readonly today: string;
	/** The plugin's `staleAfterDays` setting. */
	readonly defaultStaleAfterDays: number;
	readonly issues: readonly CampaignIssue[];
	/** False while Habitica is not set up: sending a task would only fail. */
	readonly canSend: boolean;
	/** True once Habitica has answered this session. Until then a project's progress is unknown. */
	readonly habiticaKnown: boolean;
	readonly t: Translator;
}

/** The campaigns as the home cards and the campaigns screen show them. */
export interface CampaignListView {
	readonly cards: readonly CampaignCardView[];
	/** Shown instead of the list when there is nothing to show, else `null`. */
	readonly emptyText: string | null;
	/** Why Habitica's progress may be old or missing, else `null`. */
	readonly notice: string | null;
}

export function campaignCardView(campaign: Campaign, context: CampaignViewContext): CampaignCardView {
	const gone = goneByTitle(context.issues, campaign.path);
	const { t } = context;
	const { chip, progress } = headline(campaign, t);
	const next = nextAction(campaign);
	return {
		path: campaign.path,
		title: campaign.title,
		kindLabel: t(campaign.kind === 'project' ? 'campaign.kind.project' : 'campaign.kind.research'),
		stale: !progressUnknown(campaign, context) && isStale(campaign, context.today, context.defaultStaleAfterDays)
			? { days: daysSince(lastActivity(campaign), context.today) }
			: null,
		chip,
		next: next === null ? null : next.kind === 'task' ? next.task.title : next.phase.name,
		progress: { ratio: progress.ratio, percent: Math.round(progress.ratio * 100) },
		segments: segmentsOf(campaign),
		tasks: campaign.tasks.map((task) => {
			const issue = gone.get(task.title);
			const state: TaskRowState = task.completed
				? 'completed'
				: issue === 'habitica-task-deleted'
					? 'deleted'
					: issue !== undefined
						? 'missing'
						: campaign.kind === 'project' && task.habiticaId === null
							? 'unsent'
							: 'pending';
			const row = { title: task.title, state, canSend: state === 'unsent' && context.canSend, canResend: state === 'deleted' && context.canSend, phase: task.phase };
			return isMission(task.checklist) ? { ...row, mission: task.checklist } : row;
		}),
		habits: campaign.habits.map((habit) => habitRow(habit, gone.get(habit.title) ?? null, context)),
		warnings: [...gone].map(([title, kind]) => t(kind === 'habitica-task-deleted' ? 'campaign.warning.deleted' : 'campaign.warning.missing', { title })),
		deadline: campaign.deadline,
		daysLeft: daysLeft(campaign.deadline, context.today),
	};
}

// A stored date can still be no real day (month 13), and the card never shows NaN.
function daysLeft(deadline: string | null, today: string): number | null {
	if (deadline === null) return null;
	const days = daysSince(today, deadline);
	return Number.isFinite(days) ? days : null;
}

/**
 * The problem of each task or habit of the note at `path` that Habitica no longer has, by title,
 * in the order of the issues: deleted (it can be sent again) or missing.
 */
export function goneByTitle(issues: readonly CampaignIssue[], path: string): Map<string, CampaignIssue['kind']> {
	const gone = new Map<string, CampaignIssue['kind']>();
	for (const issue of issues) if (issue.campaignPath === path && !gone.has(issue.taskTitle)) gone.set(issue.taskTitle, issue.kind);
	return gone;
}

/**
 * One habit as `HabitRow` draws it, in a campaign card or beside the Library's desk (ADR-017,
 * ADR-021): `gone` is its problem when Habitica no longer has its daily, else `null`.
 */
export function habitRow(habit: CampaignHabit, gone: CampaignIssue['kind'] | null, { canSend, t }: Pick<CampaignViewContext, 'canSend' | 't'>): HabitRowView {
	const row = { title: habit.title, canSend: false, canResend: false, schedule: scheduleText(habit.repeat, t), items: habit.checklist.length > 0 ? plural(t, 'habit.items', habit.checklist.length) : null };
	// A daily Habitica no longer has has no streak to show.
	const goal = goalOf(habit.days, gone === null ? habit.streak : null, t);
	if (gone === 'habitica-task-deleted') return { ...row, state: 'deleted', canResend: canSend, ...goal.view };
	if (gone !== null) return { ...row, state: 'missing', ...goal.view };
	if (habit.habiticaId === null) return { ...row, state: 'unsent', canSend, ...goal.view };
	return { ...row, state: goal.built ? 'built' : 'tracking', ...goal.view };
}

/**
 * The bar and the line of a daily: with a target, its streak over it ("Racha: 12 de 21 días"), or
 * the target alone while the streak is unknown; without one, a routine: the streak alone, with no
 * bar and never built.
 */
function goalOf(days: number | null, streak: number | null, t: Translator): { view: Pick<HabitRowView, 'progress' | 'text'>; built: boolean } {
	if (days === null) {
		const text = streak === null ? t('habit.routine') : plural(t, 'habit.streak', Number.isFinite(streak) && streak > 0 ? Math.floor(streak) : 0);
		return { view: { progress: null, text }, built: false };
	}
	const progress = habitProgress(streak ?? 0, days);
	const view = { done: progress.done, total: progress.total, percent: Math.round(progress.ratio * 100) };
	if (streak === null) return { view: { progress: view, text: t('habit.target', { days }) }, built: false };
	if (progress.done >= progress.total) return { view: { progress: view, text: t('habit.built', { days }) }, built: true };
	return { view: { progress: view, text: t('habit.progress', { done: progress.done, total: progress.total }) }, built: false };
}

/** "lun · mié · vie" in week order, or "Todos los días" when a daily is due on all seven. */
function scheduleText(repeat: readonly Weekday[], t: Translator): string {
	const days = WEEKDAYS.filter((day) => repeat.includes(day));
	if (days.length === 0 || days.length === WEEKDAYS.length) return t('habit.everyDay');
	return days.map((day) => weekdayShort(WEEKDAYS.indexOf(day), t)).join(' · ');
}

export function campaignListView(snapshot: CampaignSnapshot, context: Omit<CampaignViewContext, 'issues' | 'canSend' | 'habiticaKnown'>): CampaignListView {
	const { t } = context;
	const campaigns = snapshot.campaigns ?? [];
	const canSend = snapshot.status.kind !== 'not-configured';
	return {
		cards: campaigns.map((campaign) => campaignCardView(campaign, { ...context, issues: snapshot.issues, canSend, habiticaKnown: snapshot.lastSyncedAt !== null })),
		emptyText: snapshot.campaigns === null ? t('campaign.empty.beforeSync') : campaigns.length === 0 ? t('campaign.empty.none') : null,
		notice: noticeFor(snapshot.status.kind, t),
	};
}

// A project that has tasks in Habitica cannot be called stale before Habitica has answered:
// its tasks read as pending only because nobody has looked yet.
function progressUnknown(campaign: Campaign, context: CampaignViewContext): boolean {
	return campaign.kind === 'project' && !context.habiticaKnown && campaign.tasks.some((task) => task.habiticaId !== null);
}

// The open phase is the first one not completed, as in the headline; a completed phase is
// done wherever it sits.
function segmentsOf(campaign: Campaign): PhaseSegmentView[] {
	const open = campaign.phases.find((phase) => phase.status !== 'completed');
	return campaign.phases.map((phase) => {
		if (phase.status === 'completed') return { id: phase.id, name: phase.name, state: 'done', percent: 100 };
		if (phase === open) return { id: phase.id, name: phase.name, state: 'open', percent: Math.round(phaseProgress(campaign, phase.id).ratio * 100) };
		return { id: phase.id, name: phase.name, state: 'ahead', percent: 0 };
	});
}

// The bar of a project follows its open phase (the card), the total only when no phase is open.
function headline(campaign: Campaign, t: Translator): { chip: string; progress: Progress } {
	if (campaign.kind === 'research') {
		const progress = campaignProgress(campaign);
		return { chip: t('campaign.chip.phases', { done: progress.done, total: progress.total }), progress };
	}
	const open = campaign.phases.find((phase) => phase.status !== 'completed');
	if (open) {
		const progress = phaseProgress(campaign, open.id);
		return { chip: `${open.name} ${progress.done}/${progress.total}`, progress };
	}
	const progress = campaignProgress(campaign);
	return { chip: t('campaign.chip.tasks', { done: progress.done, total: progress.total }), progress };
}

function noticeFor(kind: CampaignSnapshot['status']['kind'], t: Translator): string | null {
	switch (kind) {
		case 'not-configured':
			return t('campaign.notice.notConfigured');
		case 'offline':
		case 'unauthorized':
		case 'rate-limited':
		case 'error':
			return t('campaign.notice.failed');
		case 'idle':
		case 'syncing':
		case 'synced':
			return null;
	}
}
