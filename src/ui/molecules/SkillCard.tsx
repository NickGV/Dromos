import { PhaseProgress } from '../atoms/PhaseProgress';
import { XpBar } from '../atoms/XpBar';
import type { SkillCardView } from '../presenters/skillsView';

/**
 * One skill. Earned: level, rank with its description and the XP bar. Still locked: the
 * description and what it asks, requirement by requirement, with the progress of each.
 */
export function SkillCard({ view }: { readonly view: SkillCardView }) {
	return (
		<article className={`dromos-skill ${view.unlocked ? 'is-earned' : 'is-locked'}`}>
			<header className="dromos-skill-head">
				{view.icon ? (
					<span className="dromos-skill-icon" aria-hidden="true">
						{view.icon}
					</span>
				) : null}
				<h3 className="dromos-skill-name">{view.name}</h3>
				<span className="dromos-chip">{view.statLabel}</span>
				{view.levelText ? <span className="dromos-chip is-mono">{view.levelText}</span> : null}
			</header>
			{view.rankName ? (
				<p className="dromos-skill-rank">
					<span className="dromos-skill-rank-name">{view.rankName}</span>
					{view.rankDescription ? <span className="dromos-skill-rank-text"> · {view.rankDescription}</span> : null}
				</p>
			) : null}
			{view.description ? <p className="dromos-skill-description">{view.description}</p> : null}
			{view.xp ? <XpBar {...view.xp} /> : null}
			{view.requirements.length > 0 ? (
				<ul className="dromos-skill-requirements">
					{view.requirements.map((requirement, index) => (
						<li key={`${index}:${requirement.text}`} className={requirement.met ? 'is-met' : undefined}>
							<span className="dromos-skill-requirement-text">
								{requirement.text}
								{requirement.detail ? ` · ${requirement.detail}` : ''}
							</span>
							<PhaseProgress percent={requirement.percent} label={requirement.text} />
						</li>
					))}
				</ul>
			) : null}
			{view.earnedText ? <p className="dromos-skill-earned">{view.earnedText}</p> : null}
		</article>
	);
}
