import type { ReactNode } from 'react';

export interface HatchedBarProps {
	/** Fill width, 0..100. */
	readonly percent: number;
	/** What the bar measures, read by screen readers. */
	readonly label: string;
	/** The value in words, such as "7 of 12 tasks". */
	readonly valueText: string;
	/** The line above the bar, on the left. */
	readonly start: ReactNode;
	/** The line above the bar, on the right. */
	readonly end: ReactNode;
}

/**
 * The design's hatched bar with a line of words above it (game-ui S8, S9): a campaign's tasks
 * done, or a skill's way to its next level. One progress bar for screen readers.
 */
export function HatchedBar({ percent, label, valueText, start, end }: HatchedBarProps) {
	const width = Math.min(100, Math.max(0, percent));
	return (
		<div className="dromos-hatched">
			<div className="dromos-hatched-caption">
				<span>{start}</span>
				<span>{end}</span>
			</div>
			<div className="dromos-hatched-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={width} aria-valuetext={valueText}>
				<div className={width > 0 ? 'dromos-hatched-fill' : 'dromos-hatched-fill is-empty'} style={{ width: `${width}%` }} />
			</div>
		</div>
	);
}
