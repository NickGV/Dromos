import type { IconRender } from '../atoms/Icon';
import { SkillRingButton } from '../molecules/SkillRingButton';
import type { SkillRingView, SkillsPageView } from '../presenters/skillsView';

export interface SkillsRowProps {
	/** The title, the empty state, the notice and the problems. */
	readonly page: SkillsPageView;
	/** Every skill, earned first. */
	readonly rings: readonly SkillRingView[];
	/** Opens the Skills screen on a skill. */
	readonly onOpen: (skillId: string) => void;
	readonly renderIcon: IconRender;
}

/** The skills on the home screen (game-ui S9): one row of ring medallions, each opening its skill. */
export function SkillsRow({ page, rings, onOpen, renderIcon }: SkillsRowProps) {
	return (
		<section className="dromos-section dromos-skills" aria-label={page.title}>
			<h2 className="dromos-card-title">{page.title}</h2>
			<div className="dromos-panel dromos-ring-panel">
				{page.notice ? <p className="dromos-skills-notice">{page.notice}</p> : null}
				{page.emptyText ? (
					<p className="dromos-empty">{page.emptyText}</p>
				) : (
					<div className="dromos-rings">
						{rings.map((ring) => (
							<SkillRingButton key={ring.id} view={ring} onOpen={onOpen} renderIcon={renderIcon} />
						))}
					</div>
				)}
				{page.problems.length > 0 ? (
					<ul className="dromos-skills-problems">
						{page.problems.map((problem) => (
							<li key={problem}>{problem}</li>
						))}
					</ul>
				) : null}
			</div>
		</section>
	);
}
