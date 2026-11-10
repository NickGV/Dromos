import type { ListToggleView } from '../presenters/listLimit';

/**
 * "View more (N)" under a folded list, "View less" under an expanded one (missions S3). `controls`
 * is the id of the list it folds, for `aria-controls`, where the list has one.
 */
export function ListToggle({ view, onToggle, controls }: { readonly view: ListToggleView; readonly onToggle?: () => void; readonly controls?: string }) {
	return (
		<button type="button" className="dromos-btn is-small dromos-list-toggle" aria-expanded={view.expanded} aria-controls={controls} onClick={onToggle}>
			{view.label}
		</button>
	);
}
