import type { TitleRowView, TitlesCardView } from '../presenters/titlesCardView';

export interface TitlesCardProps {
	readonly view: TitlesCardView;
	/** Writes the chosen title into `Character.md`, by its text. */
	readonly onChoose: (title: string) => void;
}

/**
 * The titles card (titles S5, option A "La lista"), drawn inside an Obsidian modal like the stage card:
 * today's title large under "Tu título", with its day and how many titles Esdras granted; then the
 * titles you earned, newest first, one row each with its day, the feat and Esdras's why signed. Today's
 * row carries the ochre bar and "En tu placa" as text; every other row a button that chooses it, named
 * by its title. A write that failed is said under the head; an unreadable row of `Titles.md` and, with a
 * single title, where titles come from, at the foot. The heading takes the focus as the card is drawn;
 * the modal's own close button and Escape close it. Its parts are drawn by plain functions, not
 * components, so a test reaches every element.
 */
export function TitlesCard({ view, onChoose }: TitlesCardProps) {
	return (
		<div className="dromos-titles-card">
			<div className="dromos-stage-sheet">
				<div className="dromos-titles-head">
					{view.kicker ? <p className="dromos-stage-kicker">{view.kicker}</p> : null}
					<h2 className="dromos-stage-title" tabIndex={-1} ref={focusHeading}>
						{view.title}
					</h2>
					<p className="dromos-stage-since">{view.since}</p>
					{view.error ? (
						<p className="dromos-titles-problem is-error" role="alert">
							{view.error}
						</p>
					) : null}
				</div>
				<section className="dromos-stage-block">
					<h3 className="dromos-stage-section">{view.listTitle}</h3>
					<ul className="dromos-titles-list">{view.rows.map((row) => titleRow(row, view, onChoose))}</ul>
				</section>
				{view.note ? <p className="dromos-titles-note">{view.note}</p> : null}
				{view.unreadable ? <p className="dromos-titles-problem">{view.unreadable}</p> : null}
			</div>
		</div>
	);
}

/** Moves the focus to the heading as the card is drawn, without scrolling: the dialog opens on today's title. */
function focusHeading(heading: HTMLHeadingElement | null): void {
	heading?.focus({ preventScroll: true });
}

/** One earned title: its name and day, the feat, the why signed, and "En tu placa" or the button that chooses it. */
function titleRow(row: TitleRowView, view: Pick<TitlesCardView, 'currentText' | 'useText'>, onChoose: (title: string) => void) {
	return (
		<li key={row.id} className={row.current ? 'dromos-titles-row is-current' : 'dromos-titles-row'}>
			<div className="dromos-titles-row-head">
				<h4 className="dromos-titles-name">{row.title}</h4>
				<span className="dromos-titles-when">{row.when}</span>
			</div>
			{row.feat ? <p className="dromos-titles-feat">{row.feat}</p> : null}
			{row.why ? (
				<p className="dromos-titles-why">
					{row.why} <span className="dromos-titles-sign">{row.sign}</span>
				</p>
			) : null}
			<div className="dromos-titles-action">
				{row.current ? (
					<span className="dromos-titles-mark">
						<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
							<path d="M5 12.5l4.5 4.5L19 7.5" />
						</svg>
						{view.currentText}
					</span>
				) : (
					<button type="button" className="dromos-btn is-small dromos-titles-use" aria-label={row.useLabel} onClick={() => onChoose(row.title)}>
						{view.useText}
					</button>
				)}
			</div>
		</li>
	);
}
