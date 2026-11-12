import { useId, type ReactNode } from 'react';
import { LevelMedal } from '../atoms/LevelMedal';
import { CharacterPortrait, PortraitButton, WaxSeal } from '../atoms/Portrait';
import { StatRadar } from '../atoms/StatRadar';
import { XpBar } from '../atoms/XpBar';
import { useT } from '../i18n';
import { FIRST_AVATAR, type AvatarView } from '../presenters/avatar';
import type { CharacterCardView } from '../presenters/characterCardView';
import type { CeremonyPhase } from '../presenters/levelUpView';
import type { CardVisit } from '../presenters/sinceVisitView';
import { portraitButtonLabel } from '../presenters/stageCardView';
import { titleButtonLabel } from '../presenters/titlesCardView';

export interface CharacterCardProps {
	readonly view: CharacterCardView;
	/** The sync line at its foot. */
	readonly footer: ReactNode;
	/** The step of a character level-up running now, or `null` (game-ui S4). */
	readonly ceremony?: CeremonyPhase | null;
	/** Since the last visit on this device (game-ui S15): the line under the bar, and how the bar moves. */
	readonly visit?: CardVisit | null;
	/** The skills part (S3), beside the stats radar above the sync line; absent or `null`, none. */
	readonly skills?: ReactNode;
	/**
	 * Whether the name is the screen's heading, the one a changed screen focuses: on home only. On
	 * the other screens it stays a heading, and their header card takes the focus.
	 */
	readonly heading?: boolean;
	/** Who the portrait shows (M11 S1): the character's stage and the objects of its skills; the young runner by default. */
	readonly avatar?: AvatarView;
	/**
	 * Opens the stage card (stage-card S1): the portrait becomes a button named by the stage it shows.
	 * Absent, the portrait stays a plain decoration.
	 */
	readonly onOpenStages?: () => void;
	/**
	 * Opens the titles card (titles S5): the title of the title line becomes a button named by it; the
	 * level stays text. Absent, or with no title, the line stays plain text.
	 */
	readonly onOpenTitles?: () => void;
	/** A title Esdras granted since the last one seen on this device (titles S5): the notice line, shown with `onOpenTitles` only. */
	readonly titleNews?: string | null;
}

/**
 * The character read from `Character.md` on its plaque (S2, game-ui S3): the character's portrait
 * at the stage reached, with the objects of its skills and the level medallion on its corner (M11
 * S1), the name, the title and level in small caps, the hatched XP bar with the next level, then in one row
 * the six stats as a radar (S5, S9) and the skills nearest to unlocking (S3), and the sync line at
 * its foot. During a level-up the bar fills first, then the medallion turns ochre. Since the
 * last visit the bar may wait at the value last seen and then catch up, with a line under it; a
 * level-up ceremony owns the bar while it fills. With `onOpenStages` the portrait opens the stage card;
 * the medallion stays outside the button with its own name. With `onOpenTitles` the title opens the
 * titles card, and a title newly granted shows a line with the wax seal under the name (titles S5).
 */
export function CharacterCard({ view, footer, ceremony = null, visit = null, skills = null, heading = true, avatar = FIRST_AVATAR, onOpenStages, onOpenTitles, titleNews = null }: CharacterCardProps) {
	const t = useT();
	const ceremonyOwnsBar = ceremony === 'fill' || ceremony === 'medal';
	const fill = ceremony === 'fill' ? 100 : ceremonyOwnsBar ? undefined : (visit?.heldPercent ?? undefined);
	return (
		<section className="dromos-card dromos-plaque dromos-character" aria-label={t('character.aria')}>
			<div className="dromos-character-who">
				<span className="dromos-portrait is-character">
					{onOpenStages ? (
						<PortraitButton label={portraitButtonLabel(avatar.stage, t)} onOpen={onOpenStages}>
							<CharacterPortrait avatar={avatar} />
						</PortraitButton>
					) : (
						<CharacterPortrait avatar={avatar} />
					)}
					<LevelMedal level={view.level} label={view.levelText} lit={ceremony === 'medal' || ceremony === 'final'} />
				</span>
				<div className="dromos-character-names">
					{heading ? (
						<h2 className="dromos-character-name" tabIndex={-1} data-screen-heading>
							{view.name}
						</h2>
					) : (
						<h2 className="dromos-character-name">{view.name}</h2>
					)}
					<TitleLine parts={view.titleParts} titleLabel={view.title === null ? null : titleButtonLabel(view.title, t)} onOpenTitles={onOpenTitles} />
					<XpBar {...view.xp} note={view.nextLevelText} fill={fill} catchUp={!ceremonyOwnsBar && (visit?.catchUp ?? false)} />
					{visit?.line ? <SinceLine parts={visit.parts} /> : null}
				</div>
			</div>
			{/* One slot for the notice and the row, so the plaque keeps its count of children and the portrait's
			    clip id, which React derives from it, stays the same with the notice or without it. */}
			<>
				{titleNews !== null && onOpenTitles ? <TitleNews title={titleNews} onOpen={onOpenTitles} /> : null}
				<div className="dromos-character-row">
					<StatRadar view={view.radar} />
					{skills}
				</div>
			</>
			{footer}
		</section>
	);
}

/**
 * The title and the level in small caps (game-ui S3). Each phrase stays whole, so a narrow card
 * breaks only between them, and the dot between them shows only while both share a line (S14). With
 * `titleLabel` and `onOpenTitles` the title, the first phrase, is a button that opens the titles card
 * (titles S5), a dialog; the level stays text, outside it.
 */
export function TitleLine({ parts, titleLabel = null, onOpenTitles }: { readonly parts: readonly string[]; readonly titleLabel?: string | null; readonly onOpenTitles?: () => void }) {
	return (
		<p className="dromos-character-title">
			{parts.map((part, index) => (
				<span key={index} className="dromos-character-title-part">
					{index > 0 ? <span className="dromos-character-title-dot"> · </span> : null}
					{index === 0 && titleLabel !== null && onOpenTitles ? (
						<button type="button" className="dromos-title-open" aria-label={titleLabel} aria-haspopup="dialog" onClick={onOpenTitles}>
							{part}
						</button>
					) : (
						part
					)}
				</span>
			))}
		</p>
	);
}

/**
 * The notice of a new title (titles S5): the wax seal of a new letter, "Esdras te otorgó un título:",
 * the title, and a button that opens the titles card, described by the two lines before it. Its own
 * component, so the id it needs is made only while it shows and no other id of the plaque moves.
 */
function TitleNews({ title, onOpen }: { readonly title: string; readonly onOpen: () => void }) {
	const t = useT();
	return titleNews({ id: `dromos-title-news-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`, kicker: t('titles.news'), title, openText: t('titles.news.open'), onOpen });
}

/** The notice line itself, from its texts and the id its button's description points to. */
export function titleNews({ id, kicker, title, openText, onOpen }: { readonly id: string; readonly kicker: string; readonly title: string; readonly openText: string; readonly onOpen: () => void }) {
	return (
		<div className="dromos-title-news">
			<span className="dromos-title-news-seal" aria-hidden="true">
				<WaxSeal />
			</span>
			<p className="dromos-title-news-kicker" id={`${id}-kicker`}>
				{kicker}
			</p>
			<p className="dromos-title-news-name" id={`${id}-name`}>
				{title}
			</p>
			<button type="button" className="dromos-title-news-open" aria-haspopup="dialog" aria-describedby={`${id}-kicker ${id}-name`} onClick={onOpen}>
				{openText}
			</button>
		</div>
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
					{index > 0 ? ' · ' : null}
					<span className="dromos-since-part">{part}</span>
				</span>
			))}
		</p>
	);
}
