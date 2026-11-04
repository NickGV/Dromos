import { HatchedBar } from '../atoms/HatchedBar';
import type { IconRender } from '../atoms/Icon';
import { PhaseProgress } from '../atoms/PhaseProgress';
import { RingMedallion } from '../atoms/RingMedallion';
import type { SkillDetailView } from '../presenters/skillsView';

export interface SkillDetailProps {
	readonly view: SkillDetailView;
	readonly renderIcon: IconRender;
}

/**
 * The detail of the skill chosen on the Skills screen (game-ui S9): the big medallion, the
 * name, its level or "Locked", the stat it feeds; the way to the next level, or what is still
 * asked; what counts; and its recent ledger entries.
 */
export function SkillDetail({ view, renderIcon }: SkillDetailProps) {
	return (
		<div className={view.earned ? 'dromos-panel dromos-skill-detail is-earned' : 'dromos-panel dromos-skill-detail is-locked'}>
			<div className="dromos-skill-detail-head">
				<RingMedallion percent={view.ringPercent} earned={view.earned} icon={view.icon} badge={null} renderIcon={renderIcon} size={96} />
				<div className="dromos-skill-detail-names">
					<h4 className="dromos-skill-detail-name">{view.name}</h4>
					<p className="dromos-skill-detail-level">{view.levelLine}</p>
					{view.rankDescription ? <p className="dromos-skill-detail-rank">{view.rankDescription}</p> : null}
					<p className="dromos-skill-detail-feeds">{view.feedsText}</p>
				</div>
			</div>
			{view.xp ? <HatchedBar percent={view.xp.percent} label={view.xp.ariaLabel} valueText={view.xp.valueText} start={view.xp.label} end={view.xp.valueText} /> : null}
			{view.requirements.length > 0 ? (
				<div className="dromos-skill-detail-unlock">
					{view.requirementsTitle ? <p className="dromos-skill-detail-label">{view.requirementsTitle}</p> : null}
					<ul className="dromos-skill-requirements">
						{view.requirements.map((requirement, index) => (
							<li key={`${index}:${requirement.text}`} className={requirement.met ? 'is-met' : undefined}>
								<span className="dromos-skill-requirement-text">{requirement.detail ? `${requirement.text} · ${requirement.detail}` : requirement.text}</span>
								<PhaseProgress percent={requirement.percent} label={requirement.text} />
							</li>
						))}
					</ul>
				</div>
			) : null}
			{view.description ? (
				<>
					<h5 className="dromos-skill-detail-title">{view.countsTitle}</h5>
					<p className="dromos-skill-detail-text">{view.description}</p>
				</>
			) : null}
			<h5 className="dromos-skill-detail-title">{view.recentTitle}</h5>
			{view.noRecentText ? (
				<p className="dromos-skill-detail-none">{view.noRecentText}</p>
			) : (
				<ul className="dromos-skill-entries">
					{view.recent.map((entry, index) => (
						<li key={`${index}:${entry.task}`} className="dromos-skill-entry">
							<span className="dromos-skill-entry-task">{entry.task}</span>
							<span className="dromos-visually-hidden"> · </span>
							<span className="dromos-skill-entry-detail">{entry.detail}</span>
						</li>
					))}
				</ul>
			)}
			{view.earnedText ? <p className="dromos-skill-detail-earned">{view.earnedText}</p> : null}
		</div>
	);
}
