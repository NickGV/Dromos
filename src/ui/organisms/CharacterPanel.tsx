import type { ReactNode } from 'react';
import type { CharacterCardView } from '../presenters/characterCardView';
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
	/** A level-up ribbon under the name, or `null`. */
	readonly ribbon: ReactNode;
	/** The sync line at the foot of the card; it shows in every state. */
	readonly footer: ReactNode;
}

/**
 * The character card, or an empty state, always first on the screen. When `Character.md` is
 * missing it names the expected path and shows no invented values (D4).
 */
export function CharacterPanel({ state, ribbon, footer }: CharacterPanelProps) {
	const t = useT();
	switch (state.kind) {
		case 'found':
			return <CharacterCard view={state.view} ribbon={ribbon} footer={footer} />;
		case 'missing':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					{ribbon}
					<h2 className="dromos-card-title">{t('character.missing.title')}</h2>
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
					{ribbon}
					<p className="dromos-empty">{t('character.unreadable')}</p>
					{footer}
				</section>
			);
		case 'loading':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					{ribbon}
					{/* Busy is the text alone: a busy section would hold back the sync line's live region. */}
					<p className="dromos-empty" aria-busy="true">
						{t('character.loading')}
					</p>
					{footer}
				</section>
			);
	}
}
