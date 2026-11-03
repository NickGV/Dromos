import type { IconRender } from '../atoms/Icon';
import { SkillCard } from '../molecules/SkillCard';
import { SkillMedallion } from '../molecules/SkillMedallion';
import type { SkillCardView, SkillsPageView } from '../presenters/skillsView';

export interface SkillsPanelProps {
	readonly view: SkillsPageView;
	/** The skill whose card is open, or `null`. */
	readonly selectedId: string | null;
	readonly onSelect: (skillId: string) => void;
	readonly renderIcon: IconRender;
}

/**
 * The Skills section (S5): the skills earned and the ones still to unlock, as medallions. The
 * card of the chosen one opens under the medallions of its group.
 */
export function SkillsPanel({ view, selectedId, onSelect, renderIcon }: SkillsPanelProps) {
	const group = (cards: readonly SkillCardView[]) => {
		const selected = cards.find((card) => card.id === selectedId);
		return (
			<>
				<div className="dromos-medallions">
					{cards.map((card) => (
						<SkillMedallion key={card.id} view={card} open={card.id === selectedId} onSelect={() => onSelect(card.id)} renderIcon={renderIcon} />
					))}
				</div>
				{selected ? <SkillCard view={selected} /> : null}
			</>
		);
	};
	return (
		<section className="dromos-card dromos-skills" aria-label={view.title}>
			<h2 className="dromos-card-title">{view.title}</h2>
			{view.notice ? <p className="dromos-skills-notice">{view.notice}</p> : null}
			{view.emptyText ? (
				<p className="dromos-empty">{view.emptyText}</p>
			) : (
				<>
					<h3 className="dromos-skills-subtitle">{view.earnedTitle}</h3>
					{group(view.earned)}
					<details className="dromos-skills-locked" open={view.earned.length === 0}>
						<summary className="dromos-skills-toggle">
							<h3 className="dromos-skills-subtitle">{view.lockedTitle}</h3>
						</summary>
						{group(view.locked)}
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
