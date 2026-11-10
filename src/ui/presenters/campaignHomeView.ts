import { plural, type Translator } from '../../i18n';
import type { CampaignCardView, PhaseSegmentState, TaskRowView } from './campaignView';

/** One task on the road: completed, the next step, or still ahead. */
export type RoadSegmentState = 'done' | 'next' | 'ahead';

/** One phase of the road (game-ui S7): a segment per task, or one filled segment when it has none. */
export interface RoadPhaseView {
	/** The phase id; `''` for the one stretch of a campaign without phases. */
	readonly id: string;
	/** `''` for the stretch of a campaign without phases, which draws no name. */
	readonly name: string;
	/** One state per task of the phase, in note order; empty when it has no tasks. */
	readonly segments: readonly RoadSegmentState[];
	/** A phase without tasks is one segment filled by its percent; `null` when it has tasks. */
	readonly fill: { readonly state: PhaseSegmentState; readonly percent: number } | null;
	/** "2/5": its tasks done over its tasks; `null` without tasks. */
	readonly countText: string | null;
	/** Finished: the gate after it opens. */
	readonly complete: boolean;
	/** How much of the road it takes: its tasks, at least 1. */
	readonly weight: number;
}

export interface RoadView {
	readonly phases: readonly RoadPhaseView[];
}

/**
 * The road of a campaign card: its tasks grouped by phase, by each task row's `phase` and the
 * segment `id`. The next segment is the first pending task of the open phase, the one the card
 * names as the next step.
 */
export function roadView(card: CampaignCardView): RoadView {
	if (card.segments.length === 0) {
		const percent = card.progress.percent;
		return { phases: [stretch('', '', card.tasks, -1, card.tasks.length > 0 ? null : { state: percent >= 100 ? 'done' : 'open', percent })] };
	}
	const next = nextTaskIndex(card);
	const nextRow = next >= 0 ? card.tasks[next] : undefined;
	return {
		phases: card.segments.map((segment) => {
			const rows = card.tasks.filter((row) => row.phase === segment.id);
			const phase = stretch(segment.id, segment.name, rows, nextRow ? rows.indexOf(nextRow) : -1, rows.length > 0 ? null : { state: segment.state, percent: segment.percent });
			return segment.state === 'done' ? { ...phase, complete: true } : phase;
		}),
	};
}

/**
 * The index in `card.tasks` of the next step: the first task not completed in the open phase,
 * the one the road draws in ochre. -1 when there is none, as for a campaign without phases.
 */
export function nextTaskIndex(card: CampaignCardView): number {
	const open = card.segments.find((segment) => segment.state === 'open');
	return open ? card.tasks.findIndex((row) => row.phase === open.id && row.state !== 'completed') : -1;
}

function stretch(id: string, name: string, rows: readonly TaskRowView[], nextIndex: number, fill: RoadPhaseView['fill']): RoadPhaseView {
	const done = rows.filter((row) => row.state === 'completed').length;
	return {
		id,
		name,
		segments: rows.map((row, index): RoadSegmentState => (row.state === 'completed' ? 'done' : index === nextIndex ? 'next' : 'ahead')),
		fill,
		countText: rows.length > 0 ? `${done}/${rows.length}` : null,
		complete: rows.length > 0 ? done === rows.length : fill?.state === 'done',
		weight: Math.max(1, rows.length),
	};
}

/**
 * One campaign as the home screen shows it (game-ui S7). Folded (home-fit S1) it is one row with
 * its name and seal or count, a thin bar of the whole campaign and the next step; open, its road
 * and a button to the campaigns screen.
 */
export interface CampaignHomeCardView {
	/** The campaign the card opens. */
	readonly path: string;
	readonly title: string;
	/** The name of the open card's button to the campaigns screen: "Open campaign Kairos". */
	readonly openLabel: string;
	/** That button's text: "Open campaign". */
	readonly openText: string;
	/** "stalled" while the campaign is stale, else `null`. */
	readonly seal: string | null;
	/** "3 of 7 tasks" (phases for a campaign without tasks); `null` while the seal shows. */
	readonly countText: string | null;
	readonly road: RoadView;
	/** What screen readers hear for the road: one progress bar. */
	readonly progress: { readonly label: string; readonly percent: number; readonly valueText: string };
	/** The thin bar of the folded card: tasks done over tasks (phases without tasks), 0..100, and "3 of 7 tasks". */
	readonly overall: { readonly percent: number; readonly text: string };
	readonly nextLabel: string;
	readonly next: string;
	/** "No progress for 9 days" while stale. */
	readonly staleText: string | null;
	/** One short line when Habitica no longer has some of its tasks or habits, so nothing is hidden. */
	readonly problem: string | null;
}

export function campaignHomeCardView(card: CampaignCardView, t: Translator): CampaignHomeCardView {
	const overall = overallProgress(card);
	const countText = overallCountText(overall, t);
	return {
		path: card.path,
		title: card.title,
		openLabel: t('campaign.open', { title: card.title }),
		openText: t('campaign.home.open'),
		seal: card.stale ? t('campaign.seal') : null,
		countText: card.stale ? null : countText,
		road: roadView(card),
		progress: { label: t('campaign.progress.aria', { title: card.title }), percent: card.progress.percent, valueText: card.chip },
		overall: { percent: overall.total > 0 ? Math.round((overall.done / overall.total) * 100) : card.progress.percent, text: countText },
		nextLabel: t('campaign.home.next'),
		next: card.next ?? t('campaign.next.none'),
		staleText: card.stale ? plural(t, 'campaign.home.stale', card.stale.days) : null,
		problem: card.warnings.length > 0 ? plural(t, 'campaign.home.missing', card.warnings.length) : null,
	};
}

/** How far a whole campaign has gone: its tasks done over its tasks, or its phases when it has no tasks. */
export interface OverallProgress {
	readonly done: number;
	readonly total: number;
	readonly unit: 'tasks' | 'phases';
}

export function overallProgress(card: CampaignCardView): OverallProgress {
	if (card.tasks.length === 0 && card.segments.length > 0) {
		return { done: card.segments.filter((segment) => segment.state === 'done').length, total: card.segments.length, unit: 'phases' };
	}
	return { done: card.tasks.filter((row) => row.state === 'completed').length, total: card.tasks.length, unit: 'tasks' };
}

/** "3 of 7 tasks", or "1 of 3 phases" for a campaign without tasks. */
export function overallCountText(progress: OverallProgress, t: Translator): string {
	return t(progress.unit === 'phases' ? 'campaign.home.phases' : 'campaign.home.tasks', { done: progress.done, total: progress.total });
}
