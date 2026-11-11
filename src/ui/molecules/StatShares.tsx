import type { StatShareView } from '../presenters/historyView';

/**
 * Where the XP of the selected week went (M9 S2): one row per stat in the card's order, then the
 * deeds with no skill, each with its name, a bar against the week's largest row and its XP in
 * words. Every skill of a deed gained its XP, so the rows can add up to more than the week.
 */
export function StatShares({ stats }: { readonly stats: readonly StatShareView[] }) {
	return (
		<ul className="dromos-stat-shares">
			{stats.map((stat) => (
				<li key={stat.key} className={stat.unskilled ? 'dromos-stat-share is-unskilled' : 'dromos-stat-share'}>
					<span className="dromos-stat-share-name">{stat.label}</span>
					<span className="dromos-stat-share-track" aria-hidden="true">
						{stat.width > 0 ? <span className="dromos-stat-share-bar" style={{ width: `${stat.width}%` }} /> : null}
					</span>
					<span className={stat.negative ? 'dromos-stat-share-value is-negative' : 'dromos-stat-share-value'}>{stat.value}</span>
				</li>
			))}
		</ul>
	);
}
