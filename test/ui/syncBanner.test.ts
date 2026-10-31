import { describe, expect, it } from 'vitest';
import type { QuestSnapshot, SyncStatus } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { agoText, minutesSince, syncBannerView } from '../../src/ui/presenters/syncBanner';
import { aQuest } from '../fakes/quests';

const NOW = new Date('2026-10-30T14:00:00Z');
const minutesAgo = (minutes: number): Date => new Date(NOW.getTime() - minutes * 60_000);
const STALE_NOTE = 'Se muestra la última lista traída en esta sesión';

/** A snapshot with the given status; `syncedMinutesAgo` adds a list synced that long ago. */
function snapshot(status: SyncStatus, syncedMinutesAgo: number | null = null): QuestSnapshot {
	if (syncedMinutesAgo === null) return { quests: null, lastSyncedAt: null, status };
	return { quests: [aQuest('d1')], lastSyncedAt: minutesAgo(syncedMinutesAgo), status };
}

const t = createTranslator('es');

describe('minutesSince', () => {
	it('counts whole minutes, rounding down', () => {
		expect(minutesSince(minutesAgo(5), NOW)).toBe(5);
		expect(minutesSince(minutesAgo(59.9), NOW)).toBe(59);
		expect(minutesSince(minutesAgo(0.5), NOW)).toBe(0);
	});

	it('never goes below zero when the sync time is ahead of the clock', () => {
		expect(minutesSince(new Date(NOW.getTime() + 90_000), NOW)).toBe(0);
	});
});

describe('agoText', () => {
	it('says "menos de 1 min" under one minute and "N min" otherwise', () => {
		expect(agoText(0, t)).toBe('hace menos de 1 min');
		expect(agoText(1, t)).toBe('hace 1 min');
		expect(agoText(75, t)).toBe('hace 75 min');
	});
});

describe('syncBannerView', () => {
	it('shows "Sincronizado hace N min" after a sync', () => {
		expect(syncBannerView(snapshot({ kind: 'synced' }, 5), NOW, t)).toEqual({
			tone: 'success',
			message: 'Sincronizado hace 5 min',
			detail: null,
		});
	});

	it('says "menos de 1 min" right after a sync', () => {
		expect(syncBannerView(snapshot({ kind: 'synced' }, 0.5), NOW, t).message).toBe('Sincronizado hace menos de 1 min');
	});

	it('shows "Sincronizando…" while a sync runs, even with an older list', () => {
		expect(syncBannerView(snapshot({ kind: 'syncing' }, 3), NOW, t)).toEqual({
			tone: 'neutral',
			message: 'Sincronizando…',
			detail: null,
		});
	});

	it('shows "Sin conexión" with no detail when nothing was fetched in this session', () => {
		expect(syncBannerView(snapshot({ kind: 'offline' }), NOW, t)).toEqual({
			tone: 'warning',
			message: 'Sin conexión',
			detail: null,
		});
	});

	it('says the list shown is the last one fetched in this session when offline', () => {
		expect(syncBannerView(snapshot({ kind: 'offline' }, 12), NOW, t)).toEqual({
			tone: 'warning',
			message: 'Sin conexión',
			detail: `${STALE_NOTE} (hace 12 min).`,
		});
	});

	it('shows "Token inválido" with a hint to check the settings', () => {
		expect(syncBannerView(snapshot({ kind: 'unauthorized' }), NOW, t)).toEqual({
			tone: 'error',
			message: 'Token inválido',
			detail: 'Revisa el ID de usuario y el token de API de Habitica en los ajustes de Dromos.',
		});
	});

	it('adds the stale-list note after the hint when a failed sync keeps an older list', () => {
		expect(syncBannerView(snapshot({ kind: 'unauthorized' }, 2), NOW, t).detail).toBe(
			`Revisa el ID de usuario y el token de API de Habitica en los ajustes de Dromos. ${STALE_NOTE} (hace 2 min).`,
		);
	});

	it('asks for the Habitica credentials when they are not configured', () => {
		expect(syncBannerView(snapshot({ kind: 'not-configured' }), NOW, t)).toEqual({
			tone: 'neutral',
			message: 'Conecta tu cuenta de Habitica',
			detail: 'Escribe tu ID de usuario y tu token de API de Habitica en los ajustes de Dromos.',
		});
	});

	it('asks to wait the seconds Habitica sent when rate limited', () => {
		expect(syncBannerView(snapshot({ kind: 'rate-limited', retryAfterSeconds: 42 }), NOW, t)).toEqual({
			tone: 'warning',
			message: 'Demasiadas solicitudes a Habitica',
			detail: 'Espera 42 segundos antes de volver a sincronizar.',
		});
		expect(syncBannerView(snapshot({ kind: 'rate-limited', retryAfterSeconds: 1 }), NOW, t).detail).toBe(
			'Espera 1 segundo antes de volver a sincronizar.',
		);
	});

	it('asks to wait a moment when Habitica sent no delay', () => {
		expect(syncBannerView(snapshot({ kind: 'rate-limited', retryAfterSeconds: null }), NOW, t).detail).toBe(
			'Espera un momento antes de volver a sincronizar.',
		);
	});

	it('shows "No se pudo sincronizar con Habitica" for any other failure', () => {
		expect(syncBannerView(snapshot({ kind: 'error' }), NOW, t)).toEqual({
			tone: 'error',
			message: 'No se pudo sincronizar con Habitica',
			detail: 'Inténtalo de nuevo en unos minutos.',
		});
		expect(syncBannerView(snapshot({ kind: 'error' }, 7), NOW, t).detail).toBe(
			`Inténtalo de nuevo en unos minutos. ${STALE_NOTE} (hace 7 min).`,
		);
	});

	it('shows a neutral message before the first sync', () => {
		expect(syncBannerView(snapshot({ kind: 'idle' }), NOW, t)).toEqual({
			tone: 'neutral',
			message: 'Sin sincronizar todavía',
			detail: null,
		});
	});
});
