import type { StatBadgeView } from '../presenters/characterCardView';

/**
 * One character stat (game-ui S3): its label, then six pips filled up to its value, or its number
 * above six. The pips are one image named "Strength 3", so the label beside it is not read twice.
 */
export function StatBadge({ stat }: { readonly stat: StatBadgeView }) {
	return (
		<div className="dromos-stat">
			<span className="dromos-stat-label" aria-hidden="true">
				{stat.label}
			</span>
			<span className="dromos-stat-pips" role="img" aria-label={stat.ariaLabel}>
				{stat.pips ? stat.pips.map((filled, index) => <span key={index} className={filled ? 'dromos-pip is-filled' : 'dromos-pip'} />) : <span className="dromos-stat-number">{stat.value}</span>}
			</span>
		</div>
	);
}
