import type { CampaignSnapshot, CampaignIssue } from '../../application';
import { plural, type Translator } from '../../i18n';
import { campaignProgress, daysSince, isStale, lastActivity, nextAction, phaseProgress, type Campaign, type Progress } from '../../domain';

/** How one task is shown in a campaign card. */
export type TaskRowState = 'completed' | 'pending' | 'unsent' | 'missing';

export interface TaskRowView {
	readonly title: string;
	readonly state: TaskRowState;
	/** Only a project task that was never sent to Habitica can be sent. */
	readonly canSend: boolean;
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
	readonly tasks: readonly TaskRowView[];
	readonly warnings: readonly string[];
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

/** What `CampaignList` renders. */
export interface CampaignListView {
	readonly cards: readonly CampaignCardView[];
	/** Shown instead of the list when there is nothing to show, else `null`. */
	readonly emptyText: string | null;
	/** Why Habitica's progress may be old or missing, else `null`. */
	readonly notice: string | null;
	readonly footer: string;
}

export function campaignCardView(campaign: Campaign, context: CampaignViewContext): CampaignCardView {
	const missing = new Set(context.issues.filter((issue) => issue.campaignPath === campaign.path).map((issue) => issue.taskTitle));
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
		tasks: campaign.tasks.map((task) => {
			const state: TaskRowState = task.completed
				? 'completed'
				: missing.has(task.title)
					? 'missing'
					: campaign.kind === 'project' && task.habiticaId === null
						? 'unsent'
						: 'pending';
			return { title: task.title, state, canSend: state === 'unsent' && context.canSend };
		}),
		warnings: [...missing].map((title) => t('campaign.warning.missing', { title })),
	};
}

export function campaignListView(snapshot: CampaignSnapshot, context: Omit<CampaignViewContext, 'issues' | 'canSend' | 'habiticaKnown'>): CampaignListView {
	const { t } = context;
	const campaigns = snapshot.campaigns ?? [];
	const canSend = snapshot.status.kind !== 'not-configured';
	return {
		cards: campaigns.map((campaign) => campaignCardView(campaign, { ...context, issues: snapshot.issues, canSend, habiticaKnown: snapshot.lastSyncedAt !== null })),
		emptyText: snapshot.campaigns === null ? t('campaign.empty.beforeSync') : campaigns.length === 0 ? t('campaign.empty.none') : null,
		notice: noticeFor(snapshot.status.kind, t),
		footer: plural(t, 'campaign.footer', campaigns.length),
	};
}

// A project that has tasks in Habitica cannot be called stale before Habitica has answered:
// its tasks read as pending only because nobody has looked yet.
function progressUnknown(campaign: Campaign, context: CampaignViewContext): boolean {
	return campaign.kind === 'project' && !context.habiticaKnown && campaign.tasks.some((task) => task.habiticaId !== null);
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
