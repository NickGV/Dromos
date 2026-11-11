import type { CSSProperties } from 'react';
import type { WeekChartView } from '../presenters/historyView';

export interface WeekBarsProps {
	readonly view: WeekChartView;
	/** Selects the week of the bar pressed, by its Monday. */
	readonly onSelect: (week: string) => void;
}

/**
 * The XP of the last weeks as columns (M9 S2), oldest on the left, on a hairline baseline under a
 * hairline top that names its round value. Each week is a button as tall as the plot, pressed while
 * its week is selected and named in words, "Week of 3 Nov: 120 XP", so the keyboard reaches them in
 * order and a screen reader hears every value. The selected bar is ochre and the others a quiet
 * umber; the selected one shows its value at its end, and so does a hovered or focused one. A week
 * that lost XP hangs under the baseline.
 */
export function WeekBars({ view, onSelect }: WeekBarsProps) {
	// The baseline's height as a share of the plot, which the stylesheet turns into pixels.
	const plot = { '--dromos-zero': String(view.zero / 100) } as CSSProperties;
	return (
		<div className="dromos-weeks" role="group" aria-label={view.ariaLabel}>
			<div className="dromos-weeks-plot" style={plot}>
				<span className="dromos-weeks-top" aria-hidden="true">
					{view.top}
				</span>
				{view.bottom ? (
					<span className="dromos-weeks-bottom" aria-hidden="true">
						{view.bottom}
					</span>
				) : null}
				<span className="dromos-weeks-baseline" aria-hidden="true" />
				{view.bars.map((bar) => (
					<button
						key={bar.key}
						type="button"
						className={classes('dromos-week', { 'is-selected': bar.selected, 'is-current': bar.current, 'is-edge': bar.edge, 'is-negative': bar.negative })}
						aria-pressed={bar.selected}
						aria-label={bar.ariaLabel}
						onClick={() => onSelect(bar.key)}
					>
						<span className="dromos-week-column" aria-hidden="true">
							{bar.height > 0 ? <span className="dromos-week-bar" style={{ bottom: `${bar.bottom}%`, height: `${bar.height}%` }} /> : null}
							<span className="dromos-week-value" style={{ bottom: `${bar.negative ? view.zero : bar.bottom + bar.height}%` }}>
								{bar.value}
							</span>
						</span>
						<span className="dromos-week-label" aria-hidden="true">
							{bar.label}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

/** `base` with every modifier whose flag is set. */
function classes(base: string, flags: Readonly<Record<string, boolean>>): string {
	return [base, ...Object.entries(flags).flatMap(([name, on]) => (on ? [name] : []))].join(' ');
}
