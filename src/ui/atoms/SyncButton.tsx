export interface SyncButtonProps {
	/** Disables the button while a sync runs. */
	readonly syncing: boolean;
	readonly onSync: () => void;
}

/** The manual "Sincronizar" button (S8). */
export function SyncButton({ syncing, onSync }: SyncButtonProps) {
	return (
		<button type="button" className="dromos-sync-button" disabled={syncing} aria-busy={syncing} onClick={onSync}>
			Sincronizar
		</button>
	);
}
