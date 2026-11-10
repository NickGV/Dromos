import type { CampaignHomeCardView } from '../presenters/campaignHomeView';
import { CampaignRoad } from './CampaignRoad';

export interface CampaignHomeCardProps {
	readonly view: CampaignHomeCardView;
	/** Whether the card shows its road; the container keeps it, folded until opened (home-fit S1). */
	readonly open: boolean;
	/** Unique in the window: the road the toggle controls is `<cardId>-road`. */
	readonly cardId: string;
	/** Opens or folds the card of the campaign at `path`. */
	readonly onToggle: (path: string) => void;
	/** Opens the campaigns screen on the campaign at `path`. */
	readonly onOpen: (path: string) => void;
}

/** The design's chevron, pointing right while folded; the stylesheet turns it down once open. */
const CHEVRON = 'M6 4l4 4-4 4';

/**
 * One campaign on the home screen (game-ui S7), folded to one row (home-fit S1). Its tinted header
 * row is the toggle: a button in the heading with the name, the clay seal or the count, and a
 * chevron. Folded, the next step and one thin bar of the whole campaign follow it; open, the road,
 * the next step and a button that opens the campaign on the campaigns screen. The road stays
 * mounted and hidden while folded, so the toggle always controls an element.
 */
export function CampaignHomeCard({ view, open, cardId, onToggle, onOpen }: CampaignHomeCardProps) {
	const roadId = `${cardId}-road`;
	const classes = ['dromos-panel', 'dromos-campaign-card', ...(view.seal ? ['is-stale'] : []), ...(open ? ['is-open'] : [])];
	const next = (
		<p className="dromos-campaign-card-next">
			<span className="dromos-campaign-card-next-label">{view.nextLabel} · </span>
			<em>{view.next}</em>
		</p>
	);
	return (
		<article className={classes.join(' ')}>
			<h3 className="dromos-campaign-card-title">
				<button type="button" className="dromos-campaign-card-toggle" aria-expanded={open} aria-controls={roadId} onClick={() => onToggle(view.path)}>
					<span className="dromos-campaign-card-name">{view.title}</span>
					{view.seal ? <span className="dromos-seal is-small">{view.seal}</span> : null}
					{!view.seal && view.countText ? <span className="dromos-campaign-card-count">{view.countText}</span> : null}
					<svg className="dromos-campaign-card-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
						<path d={CHEVRON} />
					</svg>
				</button>
			</h3>
			{open ? null : (
				<div className="dromos-campaign-card-summary">
					{next}
					<span
						className="dromos-campaign-card-bar"
						role="progressbar"
						aria-label={view.progress.label}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={view.overall.percent}
						aria-valuetext={view.overall.text}
					>
						<span className="dromos-campaign-card-bar-fill" style={{ width: `${view.overall.percent}%` }} />
					</span>
				</div>
			)}
			<div className="dromos-campaign-card-body" id={roadId} hidden={!open}>
				<CampaignRoad road={view.road} label={view.progress.label} percent={view.progress.percent} valueText={view.progress.valueText} />
				{next}
				{view.staleText ? <p className="dromos-campaign-card-note">{view.staleText}</p> : null}
				{view.problem ? <p className="dromos-campaign-card-problem">{view.problem}</p> : null}
				<button type="button" className="dromos-btn is-small dromos-campaign-card-open" aria-label={view.openLabel} onClick={() => onOpen(view.path)}>
					{view.openText}
				</button>
			</div>
		</article>
	);
}
