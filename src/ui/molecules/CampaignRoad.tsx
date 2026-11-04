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

/** The design's flag, beside each phase's name on the wide road. */
const FLAG = 'M6 21V4M6 5h11l-2 4 2 4H6';

/**
 * A campaign's road (game-ui S7): one segment per task, grouped by phase, a gate between phases
 * and each phase's name and count under it. A phase without tasks is one segment filled by its
 * percent. Screen readers hear one progress bar; the segments are drawing. The wide road of the
 * campaigns screen (game-ui S8) puts a flag and the name above the segments and the count under.
 */
export function CampaignRoad({ road, label, percent, valueText, size = 'compact' }: CampaignRoadProps) {
	const wide = size === 'wide';
	return (
		<div className={`dromos-trail is-${size}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={valueText}>
			{road.phases.map((phase, index) => (
				<Fragment key={`${index}:${phase.id}`}>
					<span className="dromos-trail-phase" style={{ flexGrow: phase.weight }}>
						{wide && phase.name !== '' ? (
							<span className="dromos-trail-head">
								<svg className="dromos-trail-flag" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
									<path d={FLAG} />
								</svg>
								<span className="dromos-trail-name">{phase.name}</span>
							</span>
						) : null}
						<span className="dromos-trail-segments">
							{phase.fill ? (
								<span className={`dromos-trail-segment is-fill is-${phase.fill.state}`}>
									<span className="dromos-trail-fill" style={{ width: `${phase.fill.percent}%` }} />
								</span>
							) : (
								phase.segments.map((state, segment) => <span key={segment} className={`dromos-trail-segment is-${state}`} />)
							)}
						</span>
						{wide ? <WideFoot countText={phase.countText} /> : <CompactLabel name={phase.name} countText={phase.countText} />}
					</span>
					{index < road.phases.length - 1 ? <span className={phase.complete ? 'dromos-trail-gate is-reached' : 'dromos-trail-gate'} /> : null}
				</Fragment>
			))}
		</div>
	);
}

/** Under the segments of the wide road: the phase's count in tasks. */
function WideFoot({ countText }: { readonly countText: string | null }) {
	return countText !== null ? <span className="dromos-trail-count">{countText}</span> : null;
}

/** Under the segments of the compact road: the phase's name and its count. */
function CompactLabel({ name, countText }: { readonly name: string; readonly countText: string | null }) {
	if (name === '' && countText === null) return null;
	return (
		<span className="dromos-trail-label">
			<span className="dromos-trail-name">{name}</span>
			{countText !== null ? <span className="dromos-trail-count">{countText}</span> : null}
		</span>
	);
}
