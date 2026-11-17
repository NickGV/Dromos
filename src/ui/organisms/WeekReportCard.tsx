import { Fragment } from 'react';
import { Icon, type IconRender } from '../atoms/Icon';
import { PhoneDayBars } from '../molecules/PhoneDayBars';
import type { MoneyView, PhoneDayView, PhoneView, WeekReportView } from '../presenters/weekReportView';

export interface WeekReportCardProps {
	readonly view: WeekReportView;
	/** Whether the card shows its detail; the container keeps it, folded until opened, on this device. */
	readonly open: boolean;
	/** Unique in the window: the body the toggle controls; the heading is `<bodyId>-title`. */
	readonly bodyId: string;
	/** Opens or folds the card. */
	readonly onToggle: () => void;
	/** Draws the line icons of the two halves. */
	readonly renderIcon: IconRender;
}

/** The design's chevron, pointing right while folded; the stylesheet turns it down once open. */
const CHEVRON = 'M6 4l4 4-4 4';
/** The smallest tiny bar of a day with a note, so a quiet day still shows. */
const MIN_MINI_HEIGHT = 12;

/**
 * "Your week" on home (app-reports S7, option C): folded like a campaign card (home-fit S1). Its
 * header row is the toggle, with the week in words. Folded, the phone and the spending in one line,
 * seven tiny bars and the late lines follow it; open, the late lines, the phone (Kairos) and the
 * money (Cheshbon). The body stays mounted and hidden while folded, so the toggle always controls
 * an element. It only reads: it has no button but the toggle.
 */
export function WeekReportCard({ view, open, bodyId, onToggle, renderIcon }: WeekReportCardProps) {
	return (
		<section className="dromos-section dromos-report" aria-labelledby={`${bodyId}-title`}>
			<h2 className="dromos-card-title" id={`${bodyId}-title`}>
				{view.title}
			</h2>
			<article className={open ? 'dromos-panel dromos-campaign-card dromos-report-card is-open' : 'dromos-panel dromos-campaign-card dromos-report-card'}>
				<h3 className="dromos-campaign-card-title">
					<button type="button" className="dromos-campaign-card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
						<span className="dromos-campaign-card-name">{view.period}</span>
						<svg className="dromos-campaign-card-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
							<path d={CHEVRON} />
						</svg>
					</button>
				</h3>
				{open ? null : (
					<div className="dromos-report-fold">
						<div className="dromos-report-fold-row">
							<p className="dromos-report-fold-line">
								{/* Each part stays on one line; the line breaks only between them. */}
								{view.summary.map((part, index) => (
									<Fragment key={part}>
										{index > 0 ? ' · ' : null}
										<span className="dromos-report-fold-part">{part}</span>
									</Fragment>
								))}
							</p>
							{view.phone.kind === 'data' ? <MiniBars days={view.phone.days} /> : null}
						</div>
						<LateLines late={view.late} />
					</div>
				)}
				<div className="dromos-report-body" id={bodyId} hidden={!open}>
					<LateLines late={view.late} />
					<div className="dromos-report-halves">
						<PhoneHalf phone={view.phone} renderIcon={renderIcon} />
						<MoneyHalf money={view.money} renderIcon={renderIcon} />
					</div>
				</div>
			</article>
		</section>
	);
}

/** One quiet line per late app, on the tint, plain words, no alarm. */
function LateLines({ late }: { readonly late: readonly string[] }) {
	return late.length === 0 ? null : (
		<ul className="dromos-report-late">
			{late.map((line) => (
				<li key={line}>{line}</li>
			))}
		</ul>
	);
}

/** The seven tiny bars of the folded row, drawn only: the line beside them says the week in words. */
function MiniBars({ days }: { readonly days: readonly PhoneDayView[] }) {
	return (
		<span className="dromos-report-mini" aria-hidden="true">
			{days.map((day) => (
				<span
					key={day.key}
					className={day.missing ? 'dromos-report-mini-bar is-missing' : day.over ? 'dromos-report-mini-bar is-over' : 'dromos-report-mini-bar'}
					style={day.missing ? undefined : { height: `${Math.max(MIN_MINI_HEIGHT, day.height)}%` }}
				/>
			))}
		</span>
	);
}

function HalfHead({ icon, title, source, renderIcon }: { readonly icon: string; readonly title: string; readonly source: string; readonly renderIcon: IconRender }) {
	return (
		<h4 className="dromos-report-half-head">
			<Icon name={icon} render={renderIcon} className="dromos-report-mark" />
			<span className="dromos-report-half-name">{title}</span>
			<span className="dromos-report-source">{source}</span>
		</h4>
	);
}

function PhoneHalf({ phone, renderIcon }: { readonly phone: PhoneView; readonly renderIcon: IconRender }) {
	return (
		<section className="dromos-report-half is-phone">
			<HalfHead icon="hourglass" title={phone.title} source={phone.source} renderIcon={renderIcon} />
			{phone.kind === 'none' ? (
				<p className="dromos-report-none">{phone.text}</p>
			) : (
				<>
					<p className="dromos-report-total">
						<span className="dromos-report-figure">{phone.total}</span> {phone.totalLabel}
					</p>
					<p className="dromos-report-aside">{phone.average}</p>
					<PhoneDayBars days={phone.days} />
					<p className={phone.anyOver ? 'dromos-report-over is-some' : 'dromos-report-over'}>
						{phone.anyOver ? <span className="dromos-report-over-key" aria-hidden="true" /> : null}
						{phone.over}
					</p>
				</>
			)}
		</section>
	);
}

function MoneyHalf({ money, renderIcon }: { readonly money: MoneyView; readonly renderIcon: IconRender }) {
	return (
		<section className="dromos-report-half is-money">
			<HalfHead icon="coins" title={money.title} source={money.source} renderIcon={renderIcon} />
			{money.kind === 'none' ? (
				<p className="dromos-report-none">{money.text}</p>
			) : (
				<dl className="dromos-report-ledger">
					{money.rows.map((row) => (
						<div key={row.label} className="dromos-report-ledger-row">
							<dt>{row.label}</dt>
							<dd>{row.value}</dd>
						</div>
					))}
					<div className="dromos-report-ledger-row is-net">
						<dt>{money.net.label}</dt>
						<dd>{money.net.value}</dd>
					</div>
				</dl>
			)}
		</section>
	);
}
