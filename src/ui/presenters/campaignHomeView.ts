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
	const open = card.segments.find((segment) => segment.state === 'open');
	const next = open ? card.tasks.findIndex((row) => row.phase === open.id && row.state !== 'completed') : -1;
	const nextRow = next >= 0 ? card.tasks[next] : undefined;
	return {
		phases: card.segments.map((segment) => {
			const rows = card.tasks.filter((row) => row.phase === segment.id);
			const phase = stretch(segment.id, segment.name, rows, nextRow ? rows.indexOf(nextRow) : -1, rows.length > 0 ? null : { state: segment.state, percent: segment.percent });
			return segment.state === 'done' ? { ...phase, complete: true } : phase;
		}),
	};
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

/** One campaign as the home screen shows it (game-ui S7): the whole card opens the campaigns screen on it. */
export interface CampaignHomeCardView {
	/** The campaign the card opens. */
	readonly path: string;
	readonly title: string;
	/** The card button's name: "Open campaign Kairos". */
	readonly openLabel: string;
	/** "stalled" while the campaign is stale, else `null`. */
	readonly seal: string | null;
	/** "3 of 7 tasks" (phases for a campaign without tasks); `null` while the seal shows. */
	readonly countText: string | null;
	readonly road: RoadView;
	/** What screen readers hear for the road: one progress bar. */
	readonly progress: { readonly label: string; readonly percent: number; readonly valueText: string };
	readonly nextLabel: string;
	readonly next: string;
	/** "No progress for 9 days" while stale. */
	readonly staleText: string | null;
	/** One short line when Habitica no longer has some of its tasks or habits, so nothing is hidden. */
	readonly problem: string | null;
}

export function campaignHomeCardView(card: CampaignCardView, t: Translator): CampaignHomeCardView {
	return {
		path: card.path,
		title: card.title,
		openLabel: t('campaign.open', { title: card.title }),
		seal: card.stale ? t('campaign.seal') : null,
		countText: card.stale ? null : countOf(card, t),
		road: roadView(card),
		progress: { label: t('campaign.progress.aria', { title: card.title }), percent: card.progress.percent, valueText: card.chip },
		nextLabel: t('campaign.home.next'),
		next: card.next ?? t('campaign.next.none'),
		staleText: card.stale ? plural(t, 'campaign.home.stale', card.stale.days) : null,
		problem: card.warnings.length > 0 ? plural(t, 'campaign.home.missing', card.warnings.length) : null,
	};
}

function countOf(card: CampaignCardView, t: Translator): string {
	if (card.tasks.length === 0 && card.segments.length > 0) {
		return t('campaign.home.phases', { done: card.segments.filter((segment) => segment.state === 'done').length, total: card.segments.length });
	}
	return t('campaign.home.tasks', { done: card.tasks.filter((row) => row.state === 'completed').length, total: card.tasks.length });
}
