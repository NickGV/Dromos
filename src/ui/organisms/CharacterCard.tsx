import type { ReactNode } from 'react';
import { LevelMedal } from '../atoms/LevelMedal';
import { StatBadge } from '../atoms/StatBadge';
import { XpBar } from '../atoms/XpBar';
import { useT } from '../i18n';
import type { CharacterCardView } from '../presenters/characterCardView';
import type { CeremonyPhase } from '../presenters/levelUpView';

export interface CharacterCardProps {
	readonly view: CharacterCardView;
	/** The sync line at its foot. */
	readonly footer: ReactNode;
	/** The step of a character level-up running now, or `null` (game-ui S4). */
	readonly ceremony?: CeremonyPhase | null;
}

/**
 * The character read from `Character.md` (game-ui S3): the level medallion, the name, the title
 * and level in small caps, the hatched XP bar with the next level, and the six stats as pips,
 * with the sync line at its foot. It overlaps the foot of the scene above it, and its name is
 * the heading the home screen focuses. During a level-up the bar fills first, then the
 * medallion turns ochre.
 */
export function CharacterCard({ view, footer, ceremony = null }: CharacterCardProps) {
	const t = useT();
	return (
		<section className="dromos-card dromos-character" aria-label={t('character.aria')}>
			<div className="dromos-character-main">
				<div className="dromos-character-who">
					<LevelMedal level={view.level} label={view.levelText} lit={ceremony === 'medal' || ceremony === 'final'} />
					<div className="dromos-character-names">
						<h2 className="dromos-character-name" tabIndex={-1} data-screen-heading>
							{view.name}
						</h2>
						<p className="dromos-character-title">{view.titleLine}</p>
						<XpBar {...view.xp} note={view.nextLevelText} fill={ceremony === 'fill' ? 100 : undefined} />
					</div>
				</div>
				<div className="dromos-stats">
					{view.stats.map((stat) => (
						<StatBadge key={stat.id} stat={stat} />
					))}
				</div>
			</div>
			{footer}
		</section>
	);
}
