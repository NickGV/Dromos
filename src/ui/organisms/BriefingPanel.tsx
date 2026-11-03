import type { IconRender } from '../atoms/Icon';
import { MarkdownBlock, type MarkdownRender } from '../atoms/MarkdownBlock';
import { SkillIcon } from '../atoms/SkillIcon';
import type { BriefingView } from '../presenters/briefingView';

export interface BriefingPanelProps {
	readonly view: BriefingView;
	readonly renderMarkdown: MarkdownRender;
	readonly onRequest: (() => void) | null;
	/** Draws the closest skill's icon when it is an icon name; without it the icon stays text. */
	readonly renderIcon?: IconRender;
}

/** The design's scroll icon. */
const SCROLL = 'M8 4h9a2 2 0 012 2v10M8 4a2 2 0 00-2 2v12a2 2 0 002 2h9a2 2 0 002-2v-2H9.5M10 8.5h6M10 12h6';

/**
 * The panel of Esdras as a scroll (game-ui S5): rolled at its top and its bottom, a scroll icon
 * in a circle, the mission and the closest skill, the text of the day in a large serif, and the
 * copy-command button beside the signature.
 */
export function BriefingPanel({ view, renderMarkdown, onRequest, renderIcon }: BriefingPanelProps) {
	return (
		<section className="dromos-card dromos-briefing" aria-label={view.ariaLabel}>
			<h2 className="dromos-visually-hidden">{view.ariaLabel}</h2>
			<div className="dromos-scroll-edge" aria-hidden="true" />
			<div className="dromos-briefing-sheet">
				<span className="dromos-briefing-seal" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="26" height="26" focusable="false">
						<path d={SCROLL} />
					</svg>
				</span>
				<div className="dromos-briefing-text">
					{view.notice ? <p className="dromos-briefing-notice">{view.notice}</p> : null}
					<div className={view.dimmed ? 'dromos-briefing-content is-dimmed' : 'dromos-briefing-content'}>
						{view.mission ? (
							<p className="dromos-briefing-mission">
								<span className="dromos-briefing-label">{view.mission.label}</span>
								<strong>{view.mission.title}</strong>
								{view.mission.why ? <span className="dromos-briefing-why">{view.mission.why}</span> : null}
							</p>
						) : null}
						{view.near ? (
							<p className="dromos-briefing-near">
								<span className="dromos-briefing-label">{view.near.label}</span>
								<span>
									{renderIcon ? (
										<SkillIcon icon={view.near.icon} renderIcon={renderIcon} className="dromos-briefing-near-icon" />
									) : (
										<span aria-hidden="true">{view.near.icon}</span>
									)}{' '}
									{view.near.name}
								</span>
								{view.near.asks ? <span className="dromos-briefing-why">{view.near.asks}</span> : null}
							</p>
						) : null}
						{view.markdown ? <MarkdownBlock markdown={view.markdown.body} sourcePath={view.markdown.sourcePath} render={renderMarkdown} /> : null}
					</div>
					{onRequest || view.signature ? (
						<div className="dromos-briefing-foot">
							{onRequest ? (
								<button type="button" className="dromos-btn is-small dromos-briefing-request" onClick={onRequest}>
									{view.requestLabel}
								</button>
							) : null}
							{view.signature ? <p className="dromos-briefing-signature">{view.signature}</p> : null}
						</div>
					) : null}
				</div>
			</div>
			<div className="dromos-scroll-edge" aria-hidden="true" />
		</section>
	);
}
