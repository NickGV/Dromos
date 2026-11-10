import type { IconRender } from '../atoms/Icon';
import type { PlaqueSkillsView } from '../presenters/plaqueSkillsView';
import { SkillRingButton } from './SkillRingButton';

/** The medallions' size on the plaque, in pixels. */
const PLAQUE_RING_SIZE = 36;

export interface PlaqueSkillsProps {
	readonly view: PlaqueSkillsView;
	/** Opens the Skills screen on a skill. */
	readonly onOpen: (skillId: string) => void;
	readonly renderIcon: IconRender;
}

/**
 * The skills on the character's plaque (S3): "Skills · 2 of 5", then the skills nearest to
 * unlocking as small ring medallions, each a button named by its skill and its caption that opens
 * the Skills screen on it.
 */
export function PlaqueSkills({ view, onOpen, renderIcon }: PlaqueSkillsProps) {
	return (
		<div className="dromos-plaque-skills">
			<p className="dromos-plaque-skills-title">{view.title}</p>
			<div className="dromos-plaque-rings">
				{view.rings.map((ring) => (
					<SkillRingButton key={ring.id} view={ring} onOpen={onOpen} renderIcon={renderIcon} size={PLAQUE_RING_SIZE} compact />
				))}
			</div>
		</div>
	);
}
