import type { CharacterCardView } from '../presenters/characterCardView';
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
	switch (state.kind) {
		case 'found':
			return <CharacterCard view={state.view} />;
		case 'missing':
			return (
				<section className="dromos-card dromos-character-empty" aria-label="Personaje">
					<h2 className="dromos-card-title">No se encontró el personaje</h2>
					<p className="dromos-empty">
						Dromos lee el personaje de <code>{state.path}</code>. Crea esa nota y selecciona Sincronizar o vuelve a
						abrir esta pestaña.
					</p>
				</section>
			);
		case 'unreadable':
			return (
				<section className="dromos-card dromos-character-empty" aria-label="Personaje">
					<p className="dromos-empty">No se pudo leer la nota del personaje.</p>
				</section>
			);
		case 'loading':
			return (
				<section className="dromos-card dromos-character-empty" aria-label="Personaje" aria-busy="true">
					<p className="dromos-empty">Cargando el personaje…</p>
				</section>
			);
	}
}
