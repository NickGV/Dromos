import type { CampaignHomeCardView } from '../presenters/campaignHomeView';
import { CampaignRoad } from './CampaignRoad';

export interface CampaignHomeCardProps {
	readonly view: CampaignHomeCardView;
	/** Opens the campaigns screen on the campaign at `path`. */
	readonly onOpen: (path: string) => void;
}

/**
 * One campaign on the home screen (game-ui S7): a tinted header with its name and the clay
 * seal or its count, the road, and the next step. The whole card is one button, the name in its
 * heading, stretched over the card; the rest stays readable text.
 */
export function CampaignHomeCard({ view, onOpen }: CampaignHomeCardProps) {
	return (
		<article className={view.seal ? 'dromos-panel dromos-campaign-card is-stale' : 'dromos-panel dromos-campaign-card'}>
			<header className="dromos-campaign-card-head">
				<h3 className="dromos-campaign-card-title">
					<button type="button" className="dromos-campaign-card-open" aria-label={view.openLabel} onClick={() => onOpen(view.path)}>
						{view.title}
					</button>
				</h3>
				{view.seal ? <span className="dromos-seal">{view.seal}</span> : null}
				{!view.seal && view.countText ? <span className="dromos-campaign-card-count">{view.countText}</span> : null}
			</header>
			<div className="dromos-campaign-card-body">
				<CampaignRoad road={view.road} label={view.progress.label} percent={view.progress.percent} valueText={view.progress.valueText} />
				<p className="dromos-campaign-card-next">
					<span className="dromos-campaign-card-next-label">{view.nextLabel} · </span>
					<em>{view.next}</em>
				</p>
				{view.staleText ? <p className="dromos-campaign-card-note">{view.staleText}</p> : null}
				{view.problem ? <p className="dromos-campaign-card-problem">{view.problem}</p> : null}
			</div>
		</article>
	);
}
