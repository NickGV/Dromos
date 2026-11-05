import { plural, type MessageKey, type Translator } from '../../i18n';
import { nextTaskIndex, overallCountText, overallProgress, roadView, type RoadView } from './campaignHomeView';
import type { CampaignCardView, CampaignListView, HabitRowView, TaskRowView } from './campaignView';
import { dayMonth } from './dates';

/** What a task's chip says about it; the tone colors the chip. */
export type TaskChipTone = 'done' | 'next' | 'pending' | 'unsent' | 'missing';

/** One task row of the campaigns screen (game-ui S8). The circle is a status only: Dromos completes nothing. */
export interface CampaignTaskView {
	readonly title: string;
	readonly completed: boolean;
	readonly chip: { readonly label: string; readonly tone: TaskChipTone };
	/** Only a project task never sent to Habitica can be sent, and only while Habitica is set up. */
	readonly canSend: boolean;
	/** "Mission · 2/5", present only for a task whose subtasks make it a mission (missions S2). */
	readonly mission?: string;
}

/** One panel of "Tasks by phase": a phase and its tasks, or the tasks without a known phase. */
export interface TaskGroupView {
	/** The phase id; `''` for the tasks without a known phase. */
	readonly key: string;
	readonly name: string;
	/** "2/5": its tasks done over its tasks. */
	readonly countText: string;
	readonly tasks: readonly CampaignTaskView[];
}

export interface CampaignTabView {
	readonly path: string;
	readonly title: string;
	readonly selected: boolean;
}

/** The campaign on show (game-ui S8): the header panel, the path, the tasks by phase and the habits. */
export interface CampaignDetailView {
	readonly path: string;
	readonly title: string;
	readonly kindLabel: string;
	/** "Due 28 Nov · 25 days left", "Due today", "3 days overdue" or "No deadline". */
	readonly deadlineText: string;
	/** "stalled" while the campaign is stale, else `null`. */
	readonly seal: string | null;
	/** "No progress for 9 days" while stale. */
	readonly staleText: string | null;
	readonly openNoteLabel: string;
	/** The overall bar: every task done over every task (phases for a campaign without tasks). */
	readonly progress: { readonly percent: number; readonly countText: string; readonly label: string };
	readonly nextLabel: string;
	readonly next: string;
	readonly pathTitle: string;
	/** The road, each phase counted in tasks: "3/5 tasks". */
	readonly road: RoadView;
	/** What screen readers hear for the road, apart from the overall bar: the open phase. */
	readonly roadProgress: { readonly label: string; readonly percent: number; readonly valueText: string };
	readonly tasksTitle: string;
	/** Empty for a campaign without tasks. */
	readonly groups: readonly TaskGroupView[];
	readonly habitsTitle: string;
	readonly habits: readonly HabitRowView[];
	/** Every problem of the campaign, in full. */
	readonly warnings: readonly string[];
}

/** The campaigns screen (game-ui S8): its title, one tab per campaign and the campaign on show. */
export interface CampaignScreenView {
	/** The header card's title: "Campaigns · Kairos", or "Campaigns" while there is none to show. */
	readonly title: string;
	readonly tabsLabel: string;
	readonly tabs: readonly CampaignTabView[];
	/** Why Habitica's progress may be old or missing, else `null`. */
	readonly notice: string | null;
	/** Shown instead of a campaign when there is none, else `null`. */
	readonly emptyText: string | null;
	readonly campaign: CampaignDetailView | null;
}

/**
 * The campaigns screen for the campaign at `selected`; the first one when nothing is selected or
 * the selected one is gone. Choosing another tab only changes `selected`: nothing is fetched.
 */
export function campaignScreenView(list: CampaignListView, selected: string | null, t: Translator): CampaignScreenView {
	const shown = list.cards.find((card) => card.path === selected) ?? list.cards[0] ?? null;
	return {
		title: shown ? t('screen.campaigns.named', { name: shown.title }) : t('screen.campaigns'),
		tabsLabel: t('campaign.screen.choose'),
		tabs: list.cards.map((card) => ({ path: card.path, title: card.title, selected: card === shown })),
		notice: list.notice,
		emptyText: list.emptyText,
		campaign: shown ? detailOf(shown, t) : null,
	};
}

function detailOf(card: CampaignCardView, t: Translator): CampaignDetailView {
	const overall = overallProgress(card);
	const road = roadView(card);
	return {
		path: card.path,
		title: card.title,
		kindLabel: card.kindLabel,
		deadlineText: deadlineText(card.deadline, card.daysLeft, t),
		seal: card.stale ? t('campaign.seal') : null,
		staleText: card.stale ? plural(t, 'campaign.home.stale', card.stale.days) : null,
		openNoteLabel: t('campaign.screen.openNote'),
		progress: {
			percent: overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : 0,
			countText: overallCountText(overall, t),
			label: t('campaign.progress.aria', { title: card.title }),
		},
		nextLabel: t('campaign.home.next'),
		next: card.next ?? t('campaign.next.none'),
		pathTitle: t('campaign.screen.path'),
		road: {
			phases: road.phases.map((phase) =>
				phase.countText === null ? phase : { ...phase, countText: t('campaign.screen.phaseTasks', { done: phase.segments.filter((segment) => segment === 'done').length, total: phase.segments.length }) },
			),
		},
		roadProgress: { label: t('campaign.screen.road.aria', { title: card.title }), percent: card.progress.percent, valueText: card.chip },
		tasksTitle: t('campaign.screen.tasks'),
		groups: groupsOf(card, t),
		habitsTitle: t('campaign.screen.habits'),
		habits: card.habits,
		warnings: card.warnings,
	};
}

// By each row's `phase` and the segment `id`, in road order; a phase with no tasks has no panel,
// and the tasks whose phase is unknown, or missing, go in a last group so none is hidden.
function groupsOf(card: CampaignCardView, t: Translator): TaskGroupView[] {
	const next = nextTaskIndex(card);
	const rows = card.tasks.map((row, index) => ({ phase: row.phase ?? null, view: taskView(row, index === next, t) }));
	const known = new Set(card.segments.map((segment) => segment.id));
	const groups = card.segments.map((segment) => group(segment.id, segment.name, rows.filter((row) => row.phase === segment.id).map((row) => row.view)));
	groups.push(group('', t('campaign.screen.noPhase'), rows.filter((row) => row.phase === null || !known.has(row.phase)).map((row) => row.view)));
	return groups.filter((item) => item.tasks.length > 0);
}

function group(key: string, name: string, tasks: CampaignTaskView[]): TaskGroupView {
	return { key, name, countText: `${tasks.filter((row) => row.completed).length}/${tasks.length}`, tasks };
}

// A problem says more than the order of the road: a task Habitica lost, or one that cannot be
// sent while Habitica is not set up, is chipped as such even when it is the next one. A task that
// can be sent shows the button, never "Not linked" beside it (calm-ui S4).
function taskView(row: TaskRowView, isNext: boolean, t: Translator): CampaignTaskView {
	const chip = (label: MessageKey, tone: TaskChipTone) => ({ label: t(label), tone });
	const mission = row.mission ? { mission: t('quests.mission', { done: row.mission.done, total: row.mission.total }) } : {};
	const view = (value: CampaignTaskView['chip']): CampaignTaskView => ({ title: row.title, completed: row.state === 'completed', chip: value, canSend: row.canSend, ...mission });
	if (row.state === 'completed') return view(chip('task.state.done', 'done'));
	if (row.state === 'missing') return view(chip('task.missing', 'missing'));
	if (row.state === 'unsent' && !row.canSend) return view(chip('task.unsent', 'unsent'));
	return view(isNext ? chip('task.state.next', 'next') : chip('task.state.pending', 'pending'));
}

/**
 * The deadline line of a campaign: "Due 28 Nov · 25 days left", "Due today" on the day,
 * "3 days overdue" once past, and "No deadline" without one or when it is no real day.
 */
export function deadlineText(deadline: string | null, daysLeft: number | null, t: Translator): string {
	if (deadline === null || daysLeft === null) return t('campaign.screen.noDeadline');
	if (daysLeft === 0) return t('campaign.screen.dueToday');
	if (daysLeft < 0) return plural(t, 'campaign.screen.overdue', -daysLeft);
	return plural(t, 'campaign.screen.due', daysLeft, { date: dayMonth(deadline, t) });
}
