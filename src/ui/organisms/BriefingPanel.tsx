import type { IconRender } from '../atoms/Icon';
import { MarkdownBlock, type MarkdownRender } from '../atoms/MarkdownBlock';
import { SkillIcon } from '../atoms/SkillIcon';
import type { TextSegment } from '../presenters/briefingText';
import type { BriefingView } from '../presenters/briefingView';

export interface BriefingPanelProps {
	readonly view: BriefingView;
	readonly renderMarkdown: MarkdownRender;
	readonly onRequest: (() => void) | null;
	/** Draws the closest skill's icon when it is an icon name; without it the icon stays text. */
	readonly renderIcon?: IconRender;
	/** Whether the letter is unrolled. The container keeps it, folded on every open of the view. */
	readonly open: boolean;
	/** Unique in the window: the top toggle is `<letterId>-toggle` and the letter `<letterId>-letter`. */
	readonly letterId: string;
	/** The top toggle: unrolls the letter, or folds it. */
	readonly onToggle: () => void;
	/** The fold button at the letter's end; the container sends the focus back to the top toggle. */
	readonly onFold: () => void;
}

/** The design's scroll icon. */
const SCROLL = 'M8 4h9a2 2 0 012 2v10M8 4a2 2 0 00-2 2v12a2 2 0 002 2h9a2 2 0 002-2v-2H9.5M10 8.5h6M10 12h6';

/**
 * The panel of Esdras as a scroll (game-ui S5), folded to its summary (S13): rolled at its top and
 * its bottom, a scroll icon in a circle that a new letter turns into an ochre wax seal, the top
 * line, the mission and the closest skill, a muted excerpt, and the row that unrolls the letter.
 * The letter (the mission's why, the text of the day in a large serif, the foot) stays mounted and
 * hidden while folded, so the note renders once. With no letter, the notice says why.
 */
export function BriefingPanel({ view, renderMarkdown, onRequest, renderIcon, open, letterId, onToggle, onFold }: BriefingPanelProps) {
	const { letter } = view;
	const toggleId = `${letterId}-toggle`;
	const letterBoxId = `${letterId}-letter`;
	const request = onRequest ? (
		<button type="button" className="dromos-btn is-small dromos-briefing-request" onClick={onRequest}>
			{view.requestLabel}
		</button>
	) : null;
	const contentClass = view.dimmed ? 'dromos-briefing-content is-dimmed' : 'dromos-briefing-content';
	const sectionClass = `dromos-card dromos-briefing${letter && open ? ' is-open' : ''}`;
	return (
		<section className={sectionClass} aria-label={view.ariaLabel}>
			<h2 className="dromos-visually-hidden">{view.ariaLabel}</h2>
			<div className="dromos-scroll-edge" aria-hidden="true" />
			<div className="dromos-briefing-sheet">
				<span className={view.newLabel ? 'dromos-briefing-seal is-wax' : 'dromos-briefing-seal'} aria-hidden="true">
					<svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
						<path d={SCROLL} />
					</svg>
				</span>
				<div className="dromos-briefing-head">
					{view.topLine ? <p className="dromos-briefing-top">{view.topLine}</p> : null}
					{view.notice ? <p className="dromos-briefing-notice">{view.notice}</p> : null}
					{view.newLabel ? <span className="dromos-briefing-new">{view.newLabel}</span> : null}
				</div>
				<div className="dromos-briefing-text">
					{view.mission || view.near || (view.excerpt && !open) ? (
						<div className={contentClass}>
							{view.mission ? (
								<p className="dromos-briefing-mission">
									<span className="dromos-briefing-label">{view.mission.label}</span>
									<strong className="dromos-briefing-title">{view.mission.title}</strong>
								</p>
							) : null}
							{view.near ? (
								<p className="dromos-briefing-near">
									<span className="dromos-briefing-label">{view.near.label}</span>
									<span className="dromos-briefing-dot" aria-hidden="true">
										{' · '}
									</span>
									<span className="dromos-briefing-near-name">
										{renderIcon ? (
											<SkillIcon icon={view.near.icon} renderIcon={renderIcon} className="dromos-briefing-near-icon" />
										) : (
											<span aria-hidden="true">{view.near.icon}</span>
										)}{' '}
										{view.near.name}
									</span>
									{view.near.asks ? (
										<>
											<span className="dromos-briefing-dot" aria-hidden="true">
												{' · '}
											</span>
											<span className="dromos-briefing-asks">{view.near.asks}</span>
										</>
									) : null}
								</p>
							) : null}
							{view.excerpt && !open ? <p className="dromos-briefing-excerpt">{view.excerpt}</p> : null}
						</div>
					) : null}
					{letter || request ? (
						<div className="dromos-briefing-row">
							{letter ? (
								<button type="button" className="dromos-btn is-small dromos-briefing-toggle" id={toggleId} aria-expanded={open} aria-controls={letterBoxId} onClick={onToggle}>
									<svg className="dromos-briefing-chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
										<path d="M6 9l6 6 6-6" />
									</svg>
									{open ? letter.foldLabel : letter.readLabel}
								</button>
							) : null}
							{view.requestInRow ? request : null}
							{view.signature && !open ? <p className="dromos-briefing-signature">{view.signature}</p> : null}
						</div>
					) : null}
					{letter ? (
						<div className="dromos-briefing-letter" id={letterBoxId}>
							<div className="dromos-briefing-letter-inner">
								<div className={contentClass}>
									{view.mission?.why ? (
										<p className="dromos-briefing-why">
											<span className="dromos-briefing-label">{view.mission.whyLabel}</span>
											<Segments segments={view.mission.why} />
										</p>
									) : null}
									{view.markdown ? <MarkdownBlock markdown={view.markdown.body} sourcePath={view.markdown.sourcePath} render={renderMarkdown} /> : null}
								</div>
								<div className="dromos-briefing-foot">
									{view.requestInRow ? null : request}
									<button type="button" className="dromos-btn is-small dromos-briefing-fold" aria-controls={letterBoxId} onClick={onFold}>
										{letter.foldLabel}
									</button>
									{view.signature ? <p className="dromos-briefing-signature">{view.signature}</p> : null}
								</div>
							</div>
						</div>
					) : null}
				</div>
			</div>
			<div className="dromos-scroll-edge" aria-hidden="true" />
		</section>
	);
}

/** The why as text, with the spans Esdras wrote in backticks as code. React escapes every piece. */
function Segments({ segments }: { readonly segments: readonly TextSegment[] }) {
	return (
		<>
			{segments.map((segment, index) => (segment.code ? <code key={index}>{segment.text}</code> : <span key={index}>{segment.text}</span>))}
		</>
	);
}
