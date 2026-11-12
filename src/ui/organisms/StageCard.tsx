import { HandDrawnCheck } from '../atoms/HandDrawnCheck';
import { CharacterPortrait } from '../atoms/Portrait';
import type { StageCardView, StageCellView, StageNextView, StageRowView } from '../presenters/stageCardView';

export interface StageCardProps {
	readonly view: StageCardView;
}

/**
 * The stage card (stage-card S1), drawn inside an Obsidian modal like the library's book card: the
 * big bust with the stage's number, its name and the days on the road; what the next stage asks,
 * each requirement ticked or with what is missing; then the twelve stages as small niches, passed
 * ones ticked, the current one ringed in ochre, the next one dashed, and what the rules count today.
 * At the last stage the road is complete. The title takes the focus as the card is drawn; the
 * modal's own close button and Escape close it, so the card adds no button. Bars, numerals and
 * drawings are decoration: each row and each stage says its state in words. Its parts are drawn by
 * plain functions, not components, so a test reaches every element.
 */
export function StageCard({ view }: StageCardProps) {
	return (
		<div className="dromos-stage-card">
			<div className="dromos-stage-sheet">
				<div className="dromos-stage-head">
					<span className="dromos-portrait is-character">
						<CharacterPortrait avatar={view.avatar} />
					</span>
					<div className="dromos-stage-names">
						<p className="dromos-stage-kicker">{view.kicker}</p>
						<h2 className="dromos-stage-title" tabIndex={-1} ref={focusTitle}>
							{view.title}
						</h2>
						<p className="dromos-stage-since">{view.since}</p>
					</div>
				</div>
				<section className="dromos-stage-block">{nextBlock(view.next, view.metText)}</section>
				<section className="dromos-stage-block">
					<h3 className="dromos-stage-section">{view.roadTitle}</h3>
					<ol className="dromos-stage-grid">{view.road.map(cell)}</ol>
					<p className="dromos-stage-evidence">
						<span className="dromos-stage-evidence-label">{view.today.label}</span> {view.today.text}
					</p>
				</section>
			</div>
		</div>
	);
}

/** Moves the focus to the title as the card is drawn, without scrolling: the dialog opens on what it is about. */
function focusTitle(title: HTMLHeadingElement | null): void {
	title?.focus({ preventScroll: true });
}

/** "Para ser Caminante" and its requirements, or, at the last stage, the road complete and the last stage's own. */
function nextBlock(next: StageNextView, metText: string) {
	const rows = <ul className="dromos-stage-reqs">{next.rows.map((row) => requirement(row, metText))}</ul>;
	if (next.kind === 'complete') {
		return (
			<>
				<h3 className="dromos-stage-complete">{next.title}</h3>
				<p className="dromos-stage-note">{next.note}</p>
				{rows}
			</>
		);
	}
	return (
		<>
			<h3 className="dromos-stage-section">
				{next.before}
				<span className="dromos-stage-section-name">{next.name}</span>
			</h3>
			{rows}
		</>
	);
}

/**
 * One requirement: the circle, ticked once met, what is asked and the count; while missing, the bar
 * and the hint. Hidden commas make it read "Nivel 3, nivel 2 de 3, Te faltan 248 XP", or "…, cumplido".
 */
function requirement(row: StageRowView, metText: string) {
	return (
		<li key={row.id} className={row.met ? 'dromos-stage-req is-met' : 'dromos-stage-req is-open'}>
			<HandDrawnCheck completed={row.met} />
			<span className="dromos-stage-req-label">{row.label}</span>
			<span className="dromos-visually-hidden">, </span>
			<span className="dromos-stage-req-count">{row.count}</span>
			{row.met ? (
				<span className="dromos-visually-hidden">, {metText}</span>
			) : (
				<div className="dromos-stage-req-foot">
					<div className="dromos-progress-track" aria-hidden="true">
						<div className="dromos-progress-fill" style={{ width: `${row.percent ?? 0}%` }} />
					</div>
					{row.hint ? (
						<p className="dromos-stage-req-hint">
							<span className="dromos-visually-hidden">, </span>
							{row.hint}
						</p>
					) : null}
				</div>
			)}
		</li>
	);
}

/** One stage of the road: its bust, a tick once passed, its numeral and name, and its state in words. */
function cell(stage: StageCellView) {
	return (
		<li key={stage.stage} className={`dromos-stage-cell is-${stage.state}`}>
			<span className="dromos-portrait is-character">
				<CharacterPortrait avatar={stage.avatar} />
			</span>
			{stage.state === 'passed' ? (
				<span className="dromos-stage-badge" aria-hidden="true">
					<svg viewBox="0 0 24 24" focusable="false">
						<path d="M5 12.5l4.5 4.5L19 7.5" />
					</svg>
				</span>
			) : null}
			<span className="dromos-stage-num" aria-hidden="true">
				{stage.numeral}
			</span>
			<span className="dromos-stage-name">{stage.name}</span>
			{stage.tag ? (
				<span className="dromos-stage-where" aria-hidden="true">
					{stage.tag}
				</span>
			) : null}
			<span className="dromos-visually-hidden">, {stage.spoken}</span>
		</li>
	);
}
