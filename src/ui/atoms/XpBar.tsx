export interface XpBarProps {
	/** XP earned inside the current level. */
	readonly current: number;
	/** XP the current level needs. */
	readonly total: number;
	/** Fill width, 0..100. */
	readonly percent: number;
	readonly text: string;
}

/** Progress through the current level, with the numbers next to the bar. */
export function XpBar({ current, total, percent, text }: XpBarProps) {
	return (
		<div className="dromos-xp">
			<div
				className="dromos-xp-track"
				role="progressbar"
				aria-label="Experiencia"
				aria-valuemin={0}
				aria-valuemax={total}
				aria-valuenow={current}
				aria-valuetext={text}
			>
				<div className="dromos-xp-fill" style={{ width: `${percent}%` }} />
			</div>
			<span className="dromos-xp-text">{text}</span>
		</div>
	);
}
