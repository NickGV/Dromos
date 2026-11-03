import { Icon, type IconRender } from '../atoms/Icon';
import { useT } from '../i18n';
import type { SkillCardView } from '../presenters/skillsView';
import { skillDetailId } from './SkillCard';

export interface SkillMedallionProps {
	readonly view: SkillCardView;
	/** True while this skill's card is open. */
	readonly open: boolean;
	readonly onSelect: () => void;
	readonly renderIcon: IconRender;
}

/**
 * One skill as a round medallion: earned in ochre with its level, locked in warm stone with a
 * small lock, its name and one line under it. Choosing it opens or closes its card.
 */
export function SkillMedallion({ view, open, onSelect, renderIcon }: SkillMedallionProps) {
	const t = useT();
	return (
		<button type="button" className={`dromos-medallion ${view.unlocked ? 'is-earned' : 'is-locked'}`} aria-expanded={open} aria-controls={skillDetailId(view.id)} onClick={onSelect}>
			<span className="dromos-medallion-face" aria-hidden="true">
				<span className="dromos-medallion-icon">{view.icon}</span>
				{view.unlocked ? <span className="dromos-medallion-badge">{view.level}</span> : <Icon name="lock" render={renderIcon} className="dromos-medallion-lock" />}
			</span>
			<span className="dromos-medallion-name">{view.name}</span>
			<span className="dromos-visually-hidden">{view.levelText ?? t('skills.medallion.locked')}</span>
			{view.caption ? <span className="dromos-medallion-caption">{view.caption}</span> : null}
		</button>
	);
}
