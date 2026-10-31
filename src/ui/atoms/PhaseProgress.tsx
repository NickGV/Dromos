export interface PhaseProgressProps {
	/** Fill width, 0..100. */
	readonly percent: number;
	/** What the bar measures, read by screen readers. */
	readonly label: string;
}

/** Progress bar of a campaign: its open phase (projects) or its phases (research). */
export function PhaseProgress({ percent, label }: PhaseProgressProps) {
	return (
		<div
			className="dromos-progress-track"
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={percent}
		>
			<div className="dromos-progress-fill" style={{ width: `${percent}%` }} />
		</div>
	);
}
