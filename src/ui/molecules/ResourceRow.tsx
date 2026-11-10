import { ResourceArt, resourceMark } from '../atoms/ResourceArt';
import { ResourceLink } from '../atoms/ResourceLink';
import type { ResourceRowView } from '../presenters/archiveView';

export interface ResourceRowProps {
	readonly view: ResourceRowView;
	/** Opens the card of the resource at `path`. */
	readonly onOpen: (path: string) => void;
	/** The id of its kind and state line, which describes the title button. */
	readonly stateId?: string;
}

/**
 * One resource in the archive's list (M8 S5): the kind's object with its seal, the kind and the
 * state in words, the title (the button that opens the card, named "Abrir la ficha de <title>"),
 * the author and the domain, when it was saved, why, and "Abrir ↗" when it has a link.
 */
export function ResourceRow({ view, onOpen, stateId }: ResourceRowProps) {
	return (
		<li className={`dromos-resource-row is-${view.state}`}>
			<ResourceArt kind={view.kind} mark={resourceMark(view.state)} />
			<div className="dromos-resource-body">
				<p className="dromos-resource-meta" id={stateId}>
					<span className="dromos-resource-kind">{view.kindLabel}</span>{' '}
					<span className="dromos-resource-state">{view.stateLabel}</span>
				</p>
				<button type="button" className="dromos-resource-title" aria-label={view.openLabel} aria-describedby={stateId} onClick={() => onOpen(view.path)}>
					{view.title}
				</button>
				{view.source ? <p className="dromos-resource-source">{view.source}</p> : null}
				<p className="dromos-resource-saved">{view.saved}</p>
				{view.why ? <p className="dromos-resource-why">{view.why}</p> : null}
			</div>
			{view.link ? <ResourceLink href={view.link.href} label={view.link.label} ariaLabel={view.link.ariaLabel} small /> : null}
		</li>
	);
}
