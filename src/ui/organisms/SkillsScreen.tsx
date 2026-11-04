import type { IconRender } from '../atoms/Icon';
import { SkillDetail } from '../molecules/SkillDetail';
import { SkillRingButton } from '../molecules/SkillRingButton';
import type { SkillsPageView, SkillsScreenView } from '../presenters/skillsView';

export interface SkillsScreenProps {
	/** The empty state, the notice and the problems. */
	readonly page: SkillsPageView;
	readonly view: SkillsScreenView;
	/** Shows the skill `skillId` in the detail. */
	readonly onSelect: (skillId: string) => void;
	readonly renderIcon: IconRender;
}

/**
 * The Skills screen (game-ui S9): one grid of ring medallions, earned first, and the detail of
 * the one selected. The detail is a polite live region, so a new selection is announced.
 */
export function SkillsScreen({ page, view, onSelect, renderIcon }: SkillsScreenProps) {
	return (
		<div className="dromos-skill-screen dromos-skills">
			<section className="dromos-section dromos-skill-grid-section" aria-label={view.gridTitle}>
				<h3 className="dromos-card-title">{view.gridTitle}</h3>
				<div className="dromos-panel dromos-ring-panel">
					{page.notice ? <p className="dromos-skills-notice">{page.notice}</p> : null}
					{page.emptyText ? (
						<p className="dromos-empty">{page.emptyText}</p>
					) : (
						<div className="dromos-rings">
							{view.rings.map((ring) => (
								<SkillRingButton key={ring.id} view={ring} onOpen={onSelect} renderIcon={renderIcon} selected={ring.selected} />
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
			{view.detail ? (
				<section className="dromos-section dromos-skill-detail-section" aria-label={view.detailTitle} aria-live="polite">
					<h3 className="dromos-card-title">{view.detailTitle}</h3>
					<SkillDetail view={view.detail} renderIcon={renderIcon} />
				</section>
			) : null}
		</div>
	);
}
