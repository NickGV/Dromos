import { Fragment } from 'react';
import type { RoadView } from '../presenters/campaignHomeView';

export interface CampaignRoadProps {
	readonly road: RoadView;
	/** What the bar measures: "Progress of Kairos". */
	readonly label: string;
	/** The campaign's progress, 0..100, as screen readers hear it. */
	readonly percent: number;
	/** The value in words, such as "MVP 3/5". */
	readonly valueText: string;
	/** `compact` on the home cards; `wide` for a campaign's own screen. */
	readonly size?: 'compact' | 'wide';
}

/**
 * A campaign's road (game-ui S7): one segment per task, grouped by phase, a gate between phases
 * and each phase's name and count under it. A phase without tasks is one segment filled by its
 * percent. Screen readers hear one progress bar; the segments are drawing.
 */
export function CampaignRoad({ road, label, percent, valueText, size = 'compact' }: CampaignRoadProps) {
	return (
		<div className={`dromos-trail is-${size}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={valueText}>
			{road.phases.map((phase, index) => (
				<Fragment key={`${index}:${phase.id}`}>
					<span className="dromos-trail-phase" style={{ flexGrow: phase.weight }}>
						<span className="dromos-trail-segments">
							{phase.fill ? (
								<span className={`dromos-trail-segment is-fill is-${phase.fill.state}`}>
									<span className="dromos-trail-fill" style={{ width: `${phase.fill.percent}%` }} />
								</span>
							) : (
								phase.segments.map((state, segment) => <span key={segment} className={`dromos-trail-segment is-${state}`} />)
							)}
						</span>
						{phase.name !== '' || phase.countText !== null ? (
							<span className="dromos-trail-label">
								<span className="dromos-trail-name">{phase.name}</span>
								{phase.countText !== null ? <span className="dromos-trail-count">{phase.countText}</span> : null}
							</span>
						) : null}
					</span>
					{index < road.phases.length - 1 ? <span className={phase.complete ? 'dromos-trail-gate is-reached' : 'dromos-trail-gate'} /> : null}
				</Fragment>
			))}
		</div>
	);
}
