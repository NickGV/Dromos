import type { DayBarView } from '../presenters/historyView';

/**
 * The seven days of the selected week as small columns (M9 S2), Monday first: the XP above each, the
 * day's short name and number under it, today marked in the current week and the days still ahead
 * left quiet. The drawing is hidden from screen readers; each day says itself in words, "Monday
 * 9 Nov: 20 XP".
 */
export function DayBars({ days }: { readonly days: readonly DayBarView[] }) {
	return (
		<ol className="dromos-days">
			{days.map((day) => (
				<li key={day.key} className={day.today ? 'dromos-day is-today' : day.ahead ? 'dromos-day is-ahead' : 'dromos-day'}>
					<span className="dromos-day-figure" aria-hidden="true">
						<span className={day.negative ? 'dromos-day-value is-negative' : 'dromos-day-value'}>{day.value}</span>
						<span className="dromos-day-track">{day.height > 0 ? <span className="dromos-day-bar" style={{ height: `${day.height}%` }} /> : null}</span>
						<span className="dromos-day-name">{day.label}</span>
						<span className="dromos-day-date">{day.date}</span>
					</span>
					<span className="dromos-visually-hidden">{day.text}</span>
				</li>
			))}
		</ol>
	);
}
