import { HatchedBar } from '../atoms/HatchedBar';
import type { CampaignDetailView } from '../presenters/campaignScreenView';

export interface CampaignHeaderPanelProps {
	readonly view: CampaignDetailView;
	/** Opens the campaign's note in another tab. */
	readonly onOpenNote: (path: string) => void;
}

/**
 * The head of the campaigns screen (game-ui S8): a tinted band with the kind, the name, the
 * deadline, the clay seal while stale and "Open note"; under it the hatched bar of every task,
 * with its count and the next step.
 */
export function CampaignHeaderPanel({ view, onOpenNote }: CampaignHeaderPanelProps) {
	return (
		<div className={view.seal ? 'dromos-panel dromos-campaign-hero is-stale' : 'dromos-panel dromos-campaign-hero'}>
			<div className="dromos-campaign-hero-head">
				<div className="dromos-campaign-hero-names">
					<p className="dromos-campaign-hero-kind">{view.kindLabel}</p>
					<h3 className="dromos-campaign-hero-name">{view.title}</h3>
					<p className="dromos-campaign-hero-due">{view.deadlineText}</p>
				</div>
				<div className="dromos-campaign-hero-side">
					{view.seal ? (
						<p className="dromos-campaign-hero-stale">
							<span className="dromos-seal">{view.seal}</span>
							<span className="dromos-campaign-hero-stale-text">{view.staleText}</span>
						</p>
					) : null}
					<button type="button" className="dromos-btn is-small" onClick={() => onOpenNote(view.path)}>
						{view.openNoteLabel}
					</button>
				</div>
			</div>
			<div className="dromos-campaign-hero-body">
				<HatchedBar
					percent={view.progress.percent}
					label={view.progress.label}
					valueText={view.progress.countText}
					start={view.progress.countText}
					end={
						<>
							{`${view.nextLabel} · `}
							<em>{view.next}</em>
						</>
					}
				/>
			</div>
		</div>
	);
}
