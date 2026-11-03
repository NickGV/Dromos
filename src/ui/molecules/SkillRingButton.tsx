import type { IconRender } from '../atoms/Icon';
import { RingMedallion } from '../atoms/RingMedallion';
import type { SkillRingView } from '../presenters/skillsView';

export interface SkillRingButtonProps {
	readonly view: SkillRingView;
	/** Opens the skill: the home row opens the Skills screen on it. */
	readonly onOpen: (skillId: string) => void;
	readonly renderIcon: IconRender;
	/** The medallion's size in pixels; 88 by default. */
	readonly size?: number;
}

/** One skill as a ring medallion button (game-ui S9): the ring, the serif name and the caption under it. */
export function SkillRingButton({ view, onOpen, renderIcon, size }: SkillRingButtonProps) {
	return (
		<button type="button" className={view.earned ? 'dromos-ring-button is-earned' : 'dromos-ring-button is-locked'} aria-label={view.ariaLabel} onClick={() => onOpen(view.id)}>
			<RingMedallion percent={view.percent} earned={view.earned} icon={view.icon} badge={view.level} renderIcon={renderIcon} size={size} />
			<span className="dromos-ring-name">{view.name}</span>
			{view.caption ? <span className="dromos-ring-caption">{view.caption}</span> : null}
		</button>
	);
}
