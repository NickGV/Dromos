import type { PhoneDayView } from '../presenters/weekReportView';

/**
 * The seven days of the week's phone (app-reports S7) as small columns, Monday first, drawn as the
 * Chronicle's days are: the minutes above each, the day's short name and number under it. The bars
 * are umber, a day over a free limit clay, and a day without a note hatched with no bar, never a
 * zero. The drawing is hidden from screen readers; each day says itself in words.
 */
export function PhoneDayBars({ days }: { readonly days: readonly PhoneDayView[] }) {
	return (
		<ol className="dromos-days dromos-report-days">
			{days.map((day) => (
				<li key={day.key} className={day.missing ? 'dromos-day is-missing' : day.over ? 'dromos-day is-over' : 'dromos-day'}>
					<span className="dromos-day-figure" aria-hidden="true">
						<span className="dromos-day-value">{day.value}</span>
						<span className="dromos-day-track">{day.missing ? null : <span className="dromos-day-bar" style={{ height: `${day.height}%` }} />}</span>
						<span className="dromos-day-name">{day.label}</span>
						<span className="dromos-day-date">{day.date}</span>
					</span>
					<span className="dromos-visually-hidden">{day.text}</span>
				</li>
			))}
		</ol>
	);
}
