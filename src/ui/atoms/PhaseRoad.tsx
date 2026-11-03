import type { PhaseSegmentView } from '../presenters/campaignView';

export interface PhaseRoadProps {
	readonly segments: readonly PhaseSegmentView[];
	/** What screen readers hear as the value: the open phase's progress, 0..100. */
	readonly percent: number;
	/** What the bar measures. */
	readonly label: string;
	/** The value in words, such as "MVP 3/5". */
	readonly valueText: string;
}

/**
 * The phases of a campaign as stretches of road, one per phase. It is a single progress bar
 * for screen readers: the stretches inside it are drawing only.
 */
export function PhaseRoad({ segments, percent, label, valueText }: PhaseRoadProps) {
	return (
		<div className="dromos-road" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={valueText}>
			{segments.map((segment, index) => (
				<span key={`${index}:${segment.name}`} className={`dromos-road-segment is-${segment.state}`} title={segment.name}>
					<span className="dromos-road-fill" style={{ width: `${segment.percent}%` }} />
				</span>
			))}
		</div>
	);
}
