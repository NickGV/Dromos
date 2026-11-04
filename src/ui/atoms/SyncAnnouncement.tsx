/**
 * The hidden live region of the sync status: it announces a change of status, never the clock.
 * `StatusBanner` carries it, and while offline the sync line keeps it on its own, so going offline
 * is still announced when only Sync shows (game-ui S12, S14).
 */
export function SyncAnnouncement({ announcement }: { readonly announcement: string }) {
	return (
		<span className="dromos-visually-hidden" role="status" aria-live="polite">
			{announcement}
		</span>
	);
}
