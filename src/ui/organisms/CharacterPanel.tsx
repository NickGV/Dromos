import type { ReactNode } from 'react';
import type { CharacterCardView } from '../presenters/characterCardView';
import type { CeremonyPhase } from '../presenters/levelUpView';
import type { CardVisit } from '../presenters/sinceVisitView';
import { useT } from '../i18n';
import { CharacterCard } from './CharacterCard';

/** What the character area shows: the card, or why there is no card. */
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
	/** The sync line at the foot of the card; it shows in every state. */
	readonly footer: ReactNode;
}

/**
 * The character card, or an empty state, always first on the screen. When `Character.md` is
 * missing it names the expected path and shows no invented values (D4).
 */
export function CharacterPanel({ state, ceremony = null, visit = null, footer }: CharacterPanelProps) {
	const t = useT();
	switch (state.kind) {
		case 'found':
			return <CharacterCard view={state.view} footer={footer} ceremony={ceremony} visit={visit} />;
		case 'missing':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					<h2 className="dromos-card-title" tabIndex={-1} data-screen-heading>
						{t('character.missing.title')}
					</h2>
					<p className="dromos-empty">
						{t('character.missing.before')}
						<code>{state.path}</code>
						{t('character.missing.after')}
					</p>
					{footer}
				</section>
			);
		case 'unreadable':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					<p className="dromos-empty">{t('character.unreadable')}</p>
					{footer}
				</section>
			);
		case 'loading':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					{/* Busy is the text alone: a busy section would hold back the sync line's live region. */}
					<p className="dromos-empty" aria-busy="true">
						{t('character.loading')}
					</p>
					{footer}
				</section>
			);
	}
}
