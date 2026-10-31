import type { CharacterCardView } from '../presenters/characterCardView';
import { useT } from '../i18n';
import { CharacterCard } from './CharacterCard';

/** What the character area shows: the card, or why there is no card. */
export type CharacterPanelState =
	| { readonly kind: 'loading' }
	| { readonly kind: 'unreadable' }
	| { readonly kind: 'missing'; readonly path: string }
	| { readonly kind: 'found'; readonly view: CharacterCardView };

/**
 * The character card, or an empty state. When `Character.md` is missing it names
 * the expected path and shows no invented values (D4).
 */
export function CharacterPanel({ state }: { readonly state: CharacterPanelState }) {
	const t = useT();
	switch (state.kind) {
		case 'found':
			return <CharacterCard view={state.view} />;
		case 'missing':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					<h2 className="dromos-card-title">{t('character.missing.title')}</h2>
					<p className="dromos-empty">
						{t('character.missing.before')}
						<code>{state.path}</code>
						{t('character.missing.after')}
					</p>
				</section>
			);
		case 'unreadable':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')}>
					<p className="dromos-empty">{t('character.unreadable')}</p>
				</section>
			);
		case 'loading':
			return (
				<section className="dromos-card dromos-character-empty" aria-label={t('character.aria')} aria-busy="true">
					<p className="dromos-empty">{t('character.loading')}</p>
				</section>
			);
	}
}
