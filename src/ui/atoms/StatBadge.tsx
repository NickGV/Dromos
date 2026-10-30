export interface StatBadgeProps {
	readonly label: string;
	readonly value: number;
}

/** One character stat: its value over its label. */
export function StatBadge({ label, value }: StatBadgeProps) {
	return (
		<div className="dromos-stat">
			<span className="dromos-stat-value">{value}</span>
			<span className="dromos-stat-label">{label}</span>
		</div>
	);
}
