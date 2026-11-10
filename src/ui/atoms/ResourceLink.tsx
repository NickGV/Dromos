export interface ResourceLinkProps {
	readonly href: string;
	/** The visible words, "Abrir" or "Abrir el enlace"; the arrow after them is decoration. */
	readonly label: string;
	/** Its accessible name when the words alone do not say which link it is. */
	readonly ariaLabel?: string;
	/** The small button of a row of the archive. */
	readonly small?: boolean;
}

/**
 * The link of a resource, "Abrir ↗" (M8 S5, S6): a real link styled as a button, so Obsidian hands
 * it to the browser on desktop and on Android, and it can be long-pressed or copied like any link.
 * The address is always `http` or `https`: the vault adapter keeps no other (ADR-018).
 */
export function ResourceLink({ href, label, ariaLabel, small = false }: ResourceLinkProps) {
	return (
		<a className={small ? 'dromos-btn is-small dromos-resource-link' : 'dromos-btn dromos-resource-link'} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
			{label}
			<span aria-hidden="true"> ↗</span>
		</a>
	);
}
