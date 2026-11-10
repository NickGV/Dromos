export interface ResourceLinkProps {
	readonly href: string;
	/** The visible words, "Abrir" or "Abrir el enlace"; the arrow after them is decoration. */
	readonly label: string;
	/** Its accessible name when the words alone do not say which link it is. */
	readonly ariaLabel?: string;
	/** The small button of a row of the archive. */
	readonly small?: boolean;
	/** Runs on the click, before Obsidian opens the page; the link still opens it. */
	readonly onClick?: () => void;
}

/**
 * The link of a resource, "Abrir ↗" (M8 S5, S6): a real link styled as a button, so Obsidian opens
 * it as any link of a note, in a Web viewer tab when that core plugin takes external links (S9) and
 * otherwise in the browser, on desktop and on Android, and it can be long-pressed or copied.
 * The address is always `http` or `https`: the vault adapter keeps no other (ADR-018).
 */
export function ResourceLink({ href, label, ariaLabel, small = false, onClick }: ResourceLinkProps) {
	return (
		<a className={small ? 'dromos-btn is-small dromos-resource-link' : 'dromos-btn dromos-resource-link'} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} onClick={onClick}>
			{label}
			<span aria-hidden="true"> ↗</span>
		</a>
	);
}
