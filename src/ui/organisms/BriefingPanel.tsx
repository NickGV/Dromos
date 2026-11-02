import { MarkdownBlock, type MarkdownRender } from '../atoms/MarkdownBlock';
import type { BriefingView } from '../presenters/briefingView';

/** The panel of Esdras: an open scroll with the mission, the close skill and the text of the day. */
export function BriefingPanel({ view, renderMarkdown }: { readonly view: BriefingView; readonly renderMarkdown: MarkdownRender }) {
	return (
		<section className="dromos-card dromos-briefing" aria-label={view.ariaLabel}>
			<div className="dromos-briefing-head">
				<span className="dromos-briefing-icon" aria-hidden="true">
					📜
				</span>
				{view.notice ? <p className="dromos-empty">{view.notice}</p> : null}
			</div>
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
							<span aria-hidden="true">{view.near.icon}</span> {view.near.name}
						</span>
						{view.near.asks ? <span className="dromos-briefing-why">{view.near.asks}</span> : null}
					</p>
				) : null}
				{view.markdown ? <MarkdownBlock markdown={view.markdown.body} sourcePath={view.markdown.sourcePath} render={renderMarkdown} /> : null}
				{view.signature ? <p className="dromos-briefing-signature">{view.signature}</p> : null}
			</div>
		</section>
	);
}
