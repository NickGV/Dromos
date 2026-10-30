import type { QuestSnapshot, SyncStatus } from '../../application';

/** How loud the status banner is. */
export type BannerTone = 'neutral' | 'success' | 'warning' | 'error';

/** Text of the status banner (S8): a short message and an optional detail line. */
export interface SyncBannerView {
	readonly tone: BannerTone;
	readonly message: string;
	readonly detail: string | null;
}

const SETTINGS_HINT = 'el ID de usuario y el token de API de Habitica en los ajustes de Dromos.';

/** Whole minutes from `since` to `now`, rounded down; never negative. */
export function minutesSince(since: Date, now: Date): number {
	return Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60_000));
}

/** "hace N min", or "hace menos de 1 min" under one minute. */
export function agoText(minutes: number): string {
	return minutes < 1 ? 'hace menos de 1 min' : `hace ${minutes} min`;
}

/**
 * Banner for the quest snapshot at `now`. After a failed sync that kept an older
 * list (D3), the detail says the list shown is the last one fetched this session.
 */
export function syncBannerView(snapshot: QuestSnapshot, now: Date): SyncBannerView {
	const { status, lastSyncedAt } = snapshot;
	const ago = lastSyncedAt ? agoText(minutesSince(lastSyncedAt, now)) : null;
	const base = baseView(status, ago);
	if (!isFailure(status) || ago === null) return base;
	const staleNote = `Se muestra la última lista traída en esta sesión (${ago}).`;
	return { ...base, detail: base.detail ? `${base.detail} ${staleNote}` : staleNote };
}

function baseView(status: SyncStatus, ago: string | null): SyncBannerView {
	switch (status.kind) {
		case 'idle':
			return view('neutral', 'Sin sincronizar todavía');
		case 'syncing':
			return view('neutral', 'Sincronizando…');
		case 'synced':
			return view('success', `Sincronizado ${ago ?? agoText(0)}`);
		case 'not-configured':
			return view('neutral', 'Conecta tu cuenta de Habitica', 'Escribe tu ID de usuario y tu token de API de Habitica en los ajustes de Dromos.');
		case 'offline':
			return view('warning', 'Sin conexión');
		case 'unauthorized':
			return view('error', 'Token inválido', `Revisa ${SETTINGS_HINT}`);
		case 'rate-limited':
			return view('warning', 'Demasiadas solicitudes a Habitica', `Espera ${waitText(status.retryAfterSeconds)} antes de volver a sincronizar.`);
		case 'error':
			return view('error', 'No se pudo sincronizar con Habitica', 'Inténtalo de nuevo en unos minutos.');
	}
}

function view(tone: BannerTone, message: string, detail: string | null = null): SyncBannerView {
	return { tone, message, detail };
}

function waitText(seconds: number | null): string {
	if (seconds === null) return 'un momento';
	return seconds === 1 ? '1 segundo' : `${seconds} segundos`;
}

// Statuses after which the list on screen (if any) is not fresh.
function isFailure(status: SyncStatus): boolean {
	return status.kind !== 'idle' && status.kind !== 'syncing' && status.kind !== 'synced';
}
