import type { StatBadgeView } from '../presenters/characterCardView';

export interface StatBadgeProps {
	readonly stat: StatBadgeView;
	/**
	 * The plaque's compact cell (S5): the short label, "STR", with the full name and the value as
	 * the cell's tooltip; the pips keep them as their name, so screen readers lose nothing.
	 */
	readonly compact?: boolean;
}

/**
 * One character stat (game-ui S3): its label, then six pips filled up to its value, or its number
 * above six. The pips are one image named "Strength 3", so the label beside it is not read twice.
 */
export function StatBadge({ stat, compact = false }: StatBadgeProps) {
	return (
		<div className={compact ? 'dromos-stat is-compact' : 'dromos-stat'} title={compact ? stat.ariaLabel : undefined}>
			<span className="dromos-stat-label" aria-hidden="true">
				{compact ? stat.shortLabel : stat.label}
			</span>
			<span className="dromos-stat-pips" role="img" aria-label={stat.ariaLabel}>
				{stat.pips ? stat.pips.map((filled, index) => <span key={index} className={filled ? 'dromos-pip is-filled' : 'dromos-pip'} />) : <span className="dromos-stat-number">{stat.value}</span>}
			</span>
		</div>
	);
}
