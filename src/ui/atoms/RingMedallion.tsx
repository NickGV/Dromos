import { Icon, type IconRender } from './Icon';
import { SkillIcon } from './SkillIcon';

/** The ring's radius in the 88-unit drawing, and its length. */
const RING_RADIUS = 38;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export interface RingMedallionProps {
	/** How much of the ring is drawn, 0..100. */
	readonly percent: number;
	/** Earned: an ochre face; locked: the stone face and a lock. */
	readonly earned: boolean;
	readonly icon: string;
	/** The level badge of an earned skill, or `null` for none. */
	readonly badge: number | null;
	readonly renderIcon: IconRender;
	/** Width and height in pixels: 88 in the home row (game-ui S9), larger or smaller elsewhere. */
	readonly size?: number;
}

/**
 * A skill as a ring medallion, after the design: the ring around the face is its progress, the
 * face holds its icon, and a badge with its level or a lock sits at its foot. A drawing: the
 * button or the row around it names the skill.
 */
export function RingMedallion({ percent, earned, icon, badge, renderIcon, size = 88 }: RingMedallionProps) {
	const drawn = (Math.min(100, Math.max(0, percent)) / 100) * RING_LENGTH;
	return (
		<span className={earned ? 'dromos-ring is-earned' : 'dromos-ring is-locked'} style={{ width: `${size}px`, height: `${size}px` }} aria-hidden="true">
			<svg className="dromos-ring-drawing" viewBox="0 0 88 88" focusable="false">
				<circle className="dromos-ring-track" cx="44" cy="44" r={RING_RADIUS} />
				{drawn > 0 ? <circle className="dromos-ring-arc" cx="44" cy="44" r={RING_RADIUS} strokeDasharray={`${drawn.toFixed(1)} ${RING_LENGTH.toFixed(1)}`} transform="rotate(-90 44 44)" /> : null}
				<circle className="dromos-ring-face" cx="44" cy="44" r="31" />
			</svg>
			<SkillIcon icon={icon} renderIcon={renderIcon} className="dromos-ring-icon" />
			{earned && badge !== null ? <span className="dromos-ring-badge">{badge}</span> : null}
			{earned ? null : <Icon name="lock" render={renderIcon} className="dromos-ring-lock" />}
		</span>
	);
}
