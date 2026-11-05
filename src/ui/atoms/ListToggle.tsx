import type { ListToggleView } from '../presenters/listLimit';

/** "View more (N)" under a folded list, "View less" under an expanded one (missions S3). */
export function ListToggle({ view, onToggle }: { readonly view: ListToggleView; readonly onToggle?: () => void }) {
	return (
		<button type="button" className="dromos-btn is-small dromos-list-toggle" aria-expanded={view.expanded} onClick={onToggle}>
			{view.label}
		</button>
	);
}
