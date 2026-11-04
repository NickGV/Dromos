import { isIconName } from '../presenters/skillsView';
import { Icon, type IconRender } from './Icon';

export interface SkillIconProps {
	readonly icon: string;
	readonly renderIcon: IconRender;
	readonly className: string;
}

/**
 * A skill's icon (game-ui S9): an icon name such as `book-open` is drawn by the host app's icon
 * set; anything else, an emoji included, stays text. Decorative: the skill's name is beside it.
 */
export function SkillIcon({ icon, renderIcon, className }: SkillIconProps) {
	if (icon === '') return null;
	if (isIconName(icon)) return <Icon name={icon} render={renderIcon} className={`${className} is-named`} />;
	return (
		<span className={className} aria-hidden="true">
			{icon}
		</span>
	);
}
