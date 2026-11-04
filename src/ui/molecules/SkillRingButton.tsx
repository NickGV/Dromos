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
	/**
	 * On the Skills screen's grid: whether this skill is the one in the detail, marked and
	 * `aria-pressed`. Left out on the home row, which opens a skill and selects nothing.
	 */
	readonly selected?: boolean;
}

/** One skill as a ring medallion button (game-ui S9): the ring, the serif name and the caption under it. */
export function SkillRingButton({ view, onOpen, renderIcon, size, selected }: SkillRingButtonProps) {
	const className = `dromos-ring-button ${view.earned ? 'is-earned' : 'is-locked'}${selected ? ' is-selected' : ''}`;
	return (
		<button type="button" className={className} aria-label={view.ariaLabel} aria-pressed={selected} onClick={() => onOpen(view.id)}>
			<RingMedallion percent={view.percent} earned={view.earned} icon={view.icon} badge={view.level} renderIcon={renderIcon} size={size} />
			<span className="dromos-ring-name">{view.name}</span>
			{view.caption ? <span className="dromos-ring-caption">{view.caption}</span> : null}
		</button>
	);
}
