import type { LinkOutcome } from '../../application';
import type { Translator } from '../../i18n';
import type { BannerTone } from './syncBanner';

/** The message shown after pressing "Enviar a Habitica". */
export interface LinkOutcomeView {
	readonly tone: BannerTone;
	readonly message: string;
}

export function linkOutcomeView(outcome: LinkOutcome, t: Translator): LinkOutcomeView {
	switch (outcome.kind) {
		case 'linked':
			return { tone: 'success', message: t('link.linked') };
		case 'already-linked':
			return { tone: 'neutral', message: t('link.alreadyLinked') };
		case 'not-found':
			return { tone: 'warning', message: t('link.notFound') };
		case 'not-a-project':
			return { tone: 'warning', message: t('link.notAProject') };
		case 'habitica-failed':
			return failure(outcome.error, t);
		case 'duplicate':
			return { tone: 'warning', message: t('link.duplicate', { id: outcome.habiticaId }) };
		case 'write-failed':
			return { tone: 'error', message: t('link.writeFailed', { id: outcome.habiticaId }) };
	}
}

function failure(error: Extract<LinkOutcome, { kind: 'habitica-failed' }>['error'], t: Translator): LinkOutcomeView {
	switch (error) {
		case 'Offline':
			return { tone: 'warning', message: t('link.offline') };
		case 'Unauthorized':
			return { tone: 'error', message: t('link.unauthorized') };
		case 'RateLimited':
			return { tone: 'warning', message: t('link.rateLimited') };
		case 'Unknown':
			return { tone: 'error', message: t('link.unknown') };
	}
}
