import type { ReactNode } from 'react';
import { LevelMedal } from '../atoms/LevelMedal';
import { StatBadge } from '../atoms/StatBadge';
import { XpBar } from '../atoms/XpBar';
import { useT } from '../i18n';
import type { CharacterCardView } from '../presenters/characterCardView';
import type { CeremonyPhase } from '../presenters/levelUpView';
import type { CardVisit } from '../presenters/sinceVisitView';

export interface CharacterCardProps {
	readonly view: CharacterCardView;
	/** The sync line at its foot. */
	readonly footer: ReactNode;
	/** The step of a character level-up running now, or `null` (game-ui S4). */
	readonly ceremony?: CeremonyPhase | null;
	/** Since the last visit on this device (game-ui S15): the line under the bar, and how the bar moves. */
	readonly visit?: CardVisit | null;
}

/**
 * The character read from `Character.md` (game-ui S3): the level medallion, the name, the title
 * and level in small caps, the hatched XP bar with the next level, and the six stats as pips,
 * with the sync line at its foot. It overlaps the foot of the scene above it, and its name is
 * the heading the home screen focuses. During a level-up the bar fills first, then the
 * medallion turns ochre. Since the last visit the bar may wait at the value last seen and then
 * catch up, with a line under it; a level-up ceremony owns the bar while it fills.
 */
export function CharacterCard({ view, footer, ceremony = null, visit = null }: CharacterCardProps) {
	const t = useT();
	const ceremonyOwnsBar = ceremony === 'fill' || ceremony === 'medal';
	const fill = ceremony === 'fill' ? 100 : ceremonyOwnsBar ? undefined : (visit?.heldPercent ?? undefined);
	return (
		<section className="dromos-card dromos-character" aria-label={t('character.aria')}>
			<div className="dromos-character-main">
				<div className="dromos-character-who">
					<LevelMedal level={view.level} label={view.levelText} lit={ceremony === 'medal' || ceremony === 'final'} />
					<div className="dromos-character-names">
						<h2 className="dromos-character-name" tabIndex={-1} data-screen-heading>
							{view.name}
						</h2>
						<TitleLine parts={view.titleParts} />
						<XpBar {...view.xp} note={view.nextLevelText} fill={fill} catchUp={!ceremonyOwnsBar && (visit?.catchUp ?? false)} />
						{visit?.line ? <SinceLine parts={visit.parts} /> : null}
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

/**
 * The title and the level in small caps (game-ui S3). Each phrase stays whole, so a narrow card
 * breaks only between them, and the dot between them shows only while both share a line (S14).
 */
function TitleLine({ parts }: { readonly parts: readonly string[] }) {
	return (
		<p className="dromos-character-title">
			{parts.map((part, index) => (
				<span key={index} className="dromos-character-title-part">
					{index > 0 ? <span className="dromos-character-title-dot"> · </span> : null}
					{part}
				</span>
			))}
		</p>
	);
}

/**
 * The line under the bar since the last visit (game-ui S15). Each part stays whole when the line
 * wraps, and the dot before a part keeps to the end of the line, never the start of the next.
 */
function SinceLine({ parts }: { readonly parts: readonly string[] }) {
	return (
		<p className="dromos-since">
			{parts.map((part, index) => (
				<span key={index}>
					{index > 0 ? '\u00a0· ' : null}
					<span className="dromos-since-part">{part}</span>
				</span>
			))}
		</p>
	);
}
