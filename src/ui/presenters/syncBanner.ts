import type { QuestSnapshot, SyncStatus } from '../../application';
import { plural, type Translator } from '../../i18n';

/** How loud the status banner is. */
export type BannerTone = 'neutral' | 'success' | 'warning' | 'error';

/** Text of the status banner (S8): a short message and an optional detail line. */
export interface SyncBannerView {
	readonly tone: BannerTone;
	readonly message: string;
	readonly detail: string | null;
}

/** Whole minutes from `since` to `now`, rounded down; never negative. */
export function minutesSince(since: Date, now: Date): number {
	return Math.max(0, Math.floor((now.getTime() - since.getTime()) / 60_000));
}

/** "N min ago", or "less than 1 min ago" under one minute (in the language of `t`). */
export function agoText(minutes: number, t: Translator): string {
	return minutes < 1 ? t('time.ago.now') : t('time.ago.minutes', { minutes });
}

/**
 * Banner for the quest snapshot at `now`. After a failed sync that kept an older
 * list (D3), the detail says the list shown is the last one fetched this session.
 */
export function syncBannerView(snapshot: QuestSnapshot, now: Date, t: Translator): SyncBannerView {
	const { status, lastSyncedAt } = snapshot;
	const ago = lastSyncedAt ? agoText(minutesSince(lastSyncedAt, now), t) : null;
	const base = baseView(status, ago, t);
	if (!isFailure(status) || ago === null) return base;
	const staleNote = t('sync.staleNote', { ago });
	return { ...base, detail: base.detail ? `${base.detail} ${staleNote}` : staleNote };
}

function baseView(status: SyncStatus, ago: string | null, t: Translator): SyncBannerView {
	switch (status.kind) {
		case 'idle':
			return view('neutral', t('sync.idle'));
		case 'syncing':
			return view('neutral', t('sync.syncing'));
		case 'synced':
			return view('success', t('sync.synced', { ago: ago ?? agoText(0, t) }));
		case 'not-configured':
			return view('neutral', t('sync.notConfigured'), t('sync.notConfigured.detail'));
		case 'offline':
			return view('warning', t('sync.offline'));
		case 'unauthorized':
			return view('error', t('sync.unauthorized'), t('sync.unauthorized.detail'));
		case 'rate-limited':
			return view('warning', t('sync.rateLimited'), t('sync.rateLimited.detail', { wait: waitText(status.retryAfterSeconds, t) }));
		case 'error':
			return view('error', t('sync.error'), t('sync.error.detail'));
	}
}

function view(tone: BannerTone, message: string, detail: string | null = null): SyncBannerView {
	return { tone, message, detail };
}

function waitText(seconds: number | null, t: Translator): string {
	return seconds === null ? t('time.wait.moment') : plural(t, 'time.wait', seconds);
}

// Statuses after which the list on screen (if any) is not fresh.
function isFailure(status: SyncStatus): boolean {
	return status.kind !== 'idle' && status.kind !== 'syncing' && status.kind !== 'synced';
}
