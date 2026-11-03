import type { SkillsPageView } from '../presenters/skillsView';
import { SkillCard } from '../molecules/SkillCard';

/** The Skills section (S5): the skills earned, and the ones still to unlock with what they ask. */
export function SkillsPanel({ view }: { readonly view: SkillsPageView }) {
	return (
		<section className="dromos-card dromos-skills" aria-label={view.title}>
			<h2 className="dromos-card-title">{view.title}</h2>
			{view.notice ? <p className="dromos-skills-notice">{view.notice}</p> : null}
			{view.emptyText ? (
				<p className="dromos-empty">{view.emptyText}</p>
			) : (
				<>
					<h3 className="dromos-skills-subtitle">{view.earnedTitle}</h3>
					<div className="dromos-skill-items">
						{view.earned.map((card) => (
							<SkillCard key={card.id} view={card} />
						))}
					</div>
					<details className="dromos-skills-locked" open={view.earned.length === 0}>
						<summary className="dromos-skills-toggle">
							<h3 className="dromos-skills-subtitle">{view.lockedTitle}</h3>
						</summary>
						<div className="dromos-skill-items">
							{view.locked.map((card) => (
								<SkillCard key={card.id} view={card} />
							))}
						</div>
					</details>
				</>
			)}
			{view.problems.length > 0 ? (
				<ul className="dromos-skills-problems">
					{view.problems.map((problem) => (
						<li key={problem}>{problem}</li>
					))}
				</ul>
			) : null}
		</section>
	);
}
