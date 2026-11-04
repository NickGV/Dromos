import { useT } from '../i18n';

export interface SyncButtonProps {
	/** Marks the button busy while a sync runs; it keeps focus and ignores clicks. */
	readonly syncing: boolean;
	readonly onSync: () => void;
}

/** The manual "Sincronizar" button (S8). */
export function SyncButton({ syncing, onSync }: SyncButtonProps) {
	const t = useT();
	return (
		<button type="button" className="dromos-sync-button" aria-disabled={syncing} aria-busy={syncing} onClick={syncing ? undefined : onSync}>
			{t('action.sync')}
		</button>
	);
}
