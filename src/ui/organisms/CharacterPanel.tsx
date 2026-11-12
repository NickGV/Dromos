import type { ReactNode } from 'react';
import type { AvatarView } from '../presenters/avatar';
import type { CharacterCardView } from '../presenters/characterCardView';
import type { CeremonyPhase } from '../presenters/levelUpView';
import type { CardVisit } from '../presenters/sinceVisitView';
import { useT } from '../i18n';
import { CharacterCard } from './CharacterCard';

/** What the character's plaque shows: the character, or why there is none. */
export type CharacterPanelState =
	| { readonly kind: 'loading' }
	| { readonly kind: 'unreadable' }
	| { readonly kind: 'missing'; readonly path: string }
	| { readonly kind: 'found'; readonly view: CharacterCardView };

export interface CharacterPanelProps {
	readonly state: CharacterPanelState;
	/** The step of a character level-up running now, for the card; `null` without one (game-ui S4). */
	readonly ceremony?: CeremonyPhase | null;
	/** Since the last visit on this device, for the card (game-ui S15); `null` without it. */
	readonly visit?: CardVisit | null;
	/** The skills part (S3), above the sync line; it shows in every state, absent or `null` it does not. */
	readonly skills?: ReactNode;
	/** The sync line at the foot of the plaque; it shows in every state. */
	readonly footer: ReactNode;
	/** Whether its heading is the screen's heading, the one a changed screen focuses: on home only. */
	readonly heading?: boolean;
	/** Who the card's portrait shows (M11 S1); absent, the young runner. */
	readonly avatar?: AvatarView;
	/** Opens the stage card from the card's portrait (stage-card S1); absent, or with no character, the portrait is no button. */
	readonly onOpenStages?: () => void;
}

/**
 * The character's plaque (S2), in the scene's corner on wide panes and under it on narrow ones, on
 * every screen: the character, or an empty state. When `Character.md` is missing it names the
 * expected path and shows no invented values (D4).
 */
export function CharacterPanel({ state, ceremony = null, visit = null, skills = null, footer, heading = true, avatar, onOpenStages }: CharacterPanelProps) {
	const t = useT();
	if (state.kind === 'found') return <CharacterCard view={state.view} footer={footer} ceremony={ceremony} visit={visit} skills={skills} heading={heading} avatar={avatar} onOpenStages={onOpenStages} />;
	return (
		<section className="dromos-card dromos-plaque dromos-character-empty" aria-label={t('character.aria')}>
			{state.kind === 'missing' ? (
				<>
					{heading ? (
						<h2 className="dromos-card-title" tabIndex={-1} data-screen-heading>
							{t('character.missing.title')}
						</h2>
					) : (
						<h2 className="dromos-card-title">{t('character.missing.title')}</h2>
					)}
					<p className="dromos-empty">
						{t('character.missing.before')}
						<code>{state.path}</code>
						{t('character.missing.after')}
					</p>
				</>
			) : state.kind === 'unreadable' ? (
				<p className="dromos-empty">{t('character.unreadable')}</p>
			) : (
				// Busy is the text alone: a busy section would hold back the sync line's live region.
				<p className="dromos-empty" aria-busy="true">
					{t('character.loading')}
				</p>
			)}
			{skills}
			{footer}
		</section>
	);
}
