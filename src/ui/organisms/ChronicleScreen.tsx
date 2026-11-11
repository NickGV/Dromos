import { DayBars } from '../molecules/DayBars';
import { DeedList } from '../molecules/DeedList';
import { StatShares } from '../molecules/StatShares';
import { WeekBars } from '../molecules/WeekBars';
import type { HistoryView } from '../presenters/historyView';
import { ScreenHeader } from './ScreenHeader';

export interface ChronicleScreenProps {
	readonly view: HistoryView;
	/** Selects a week by its Monday. */
	readonly onSelectWeek: (week: string) => void;
	/** "← Path": back to home (M9 S3). */
	readonly onBack: () => void;
}

/**
 * The Chronicle screen (M9 S2, S3): its header card, "Chronicle" with "← Path" above it, then the XP of
 * the last weeks as bars under the selected week's name, XP and comparison with the week before, which a
 * live region announces when another week is chosen. Under them the selected week by day, by stat and
 * its deeds; wide panes set the two charts beside the deeds. An empty ledger says so in a sentence.
 */
export function ChronicleScreen({ view, onSelectWeek, onBack }: ChronicleScreenProps) {
	const header = <ScreenHeader title={view.title} back={{ ...view.back, onBack }} />;
	if (view.kind === 'empty') {
		return (
			<div className="dromos-history">
				{header}
				<div className="dromos-panel dromos-history-empty">
					<p className="dromos-empty">{view.text}</p>
				</div>
			</div>
		);
	}
	const { chart, week } = view;
	return (
		<div className="dromos-history">
			{header}
			<section className="dromos-panel dromos-history-weeks">
				<div className="dromos-history-head" aria-live="polite" aria-atomic="true">
					<h3 className="dromos-history-week">{week.title}</h3>
					<p className="dromos-history-xp">{week.xp}</p>
					{week.comparison ? <p className="dromos-history-compare">{week.comparison}</p> : null}
				</div>
				<WeekBars view={chart} onSelect={onSelectWeek} />
			</section>
			<div className="dromos-history-columns">
				<div className="dromos-history-column">
					<section className="dromos-section dromos-history-days" aria-label={week.titles.days}>
						<h3 className="dromos-card-title">{week.titles.days}</h3>
						<div className="dromos-panel dromos-history-panel">
							<DayBars days={week.days} />
						</div>
					</section>
					<section className="dromos-section dromos-history-stats" aria-label={week.titles.stats}>
						<h3 className="dromos-card-title">{week.titles.stats}</h3>
						<div className="dromos-panel dromos-history-panel">
							<StatShares stats={week.stats} />
						</div>
					</section>
				</div>
				<div className="dromos-history-column">
					<section className="dromos-section dromos-history-deeds" aria-label={week.titles.deeds}>
						<h3 className="dromos-card-title">{week.titles.deeds}</h3>
						<div className="dromos-panel dromos-history-panel is-deeds">{week.deedsEmpty ? <p className="dromos-history-none">{week.deedsEmpty}</p> : <DeedList lines={week.deeds} />}</div>
					</section>
				</div>
			</div>
		</div>
	);
}
