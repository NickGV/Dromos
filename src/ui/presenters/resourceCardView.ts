import type { MarkResourceFinishedOutcome } from '../../application';
import { resourceState, resourceVerb, type Resource, type ResourceKind, type ResourceState, type ResourceVerb } from '../../domain';
import type { MessageKey, Translator } from '../../i18n';
import { resourceKindLabel, resourceSource, resourceStateLabel } from './archiveView';
import { longDate } from './dates';
import type { LinkOutcomeView } from './linkOutcomeView';

/** The resource card (M8 S6): one resource unrolled in a modal, the same frame as the book card. */
export interface ResourceCardView {
	readonly path: string;
	readonly title: string;
	readonly kind: ResourceKind | null;
	readonly kindLabel: string;
	readonly state: ResourceState;
	readonly stateLabel: string;
	/** "Martin Fowler · martinfowler.com", or `null` with neither. */
	readonly source: string | null;
	/** "Guardado el 9 de noviembre · Leído el 10 de noviembre". */
	readonly dates: string;
	/** "Para qué me sirve" with the note's `why`; `null` without one. */
	readonly why: { readonly heading: string; readonly text: string } | null;
	/**
	 * "Lo que me dejó": whether the cache counts it as written (as the seal does), its text once read,
	 * or what the card says in its place: "Escrito" or "Sin escribir todavía".
	 */
	readonly takeaway: { readonly heading: string; readonly written: boolean; readonly text: string | null; readonly status: string };
	readonly seal: { readonly sealed: boolean; readonly text: string };
	readonly actions: ResourceCardActionsView;
	/** The accessible name of the modal, "Ficha de <title>". */
	readonly ariaLabel: string;
}

export interface ResourceCardActionsView {
	/** "Abrir el enlace ↗", only with a link. */
	readonly openLink: { readonly href: string; readonly label: string } | null;
	/** "Marcar como leído" (visto, escuchado), while the resource has no `finished` and the action is wired. */
	readonly mark: { readonly label: string; readonly busyLabel: string } | null;
	/** "Abrir la nota", always; the primary button while what it left is missing. */
	readonly openNote: { readonly label: string; readonly primary: boolean };
}

const MARK_LABELS: Readonly<Record<ResourceVerb, MessageKey>> = {
	read: 'archive.card.mark.read',
	watch: 'archive.card.mark.watch',
	listen: 'archive.card.mark.listen',
};

const FINISHED_LABELS: Readonly<Record<ResourceVerb, MessageKey>> = {
	read: 'archive.card.finished.read',
	watch: 'archive.card.finished.watch',
	listen: 'archive.card.finished.listen',
};

/**
 * The card of `resource` (M8 S6): its kind, state, source and dates, why it was saved, what it
 * left (the text of `takeaway` once read), the seal, and the buttons. As in the book card, the
 * text shows only where the cache counts the section as written (Q031): while it is on its way, or
 * could not be read (`null`), or came back empty, the card says "Escrito"; a section the cache
 * does not count says "Sin escribir todavía". "Marcar como leído" shows only while the resource
 * has no `finished` and `canMark` (the action is wired); "Abrir la nota" is always there.
 */
export function resourceCardView(resource: Resource, today: string, t: Translator, canMark: boolean, takeaway: string | null = null): ResourceCardView {
	const state = resourceState(resource);
	const verb = resourceVerb(resource.kind);
	const dates = [t('archive.card.saved', { date: longDate(resource.saved, today, t) })];
	if (resource.finished !== null) dates.push(t(FINISHED_LABELS[verb], { date: longDate(resource.finished, today, t) }));
	return {
		path: resource.path,
		title: resource.title,
		kind: resource.kind,
		kindLabel: resourceKindLabel(resource.kind, t),
		state,
		stateLabel: resourceStateLabel(resource, t),
		source: resourceSource(resource),
		dates: dates.join(' · '),
		why: resource.why === null ? null : { heading: t('archive.card.why'), text: resource.why },
		takeaway: {
			heading: t('archive.card.takeaway'),
			written: resource.takeawayWritten,
			text: resource.takeawayWritten && takeaway !== null && takeaway !== '' ? takeaway : null,
			status: t(resource.takeawayWritten ? 'archive.card.takeaway.written' : 'library.section.unwritten'),
		},
		seal: sealView(state, t),
		actions: {
			openLink: resource.url === null ? null : { href: resource.url, label: t('archive.card.openLink') },
			mark: resource.finished === null && canMark ? { label: t(MARK_LABELS[verb]), busyLabel: t('archive.card.marking') } : null,
			openNote: { label: t('library.card.openNote'), primary: state === 'takeaway-missing' },
		},
		ariaLabel: t('library.card.aria', { title: resource.title }),
	};
}

/** The toast shown after "Marcar como leído" (visto, escuchado). */
export function resourceOutcomeView(outcome: MarkResourceFinishedOutcome, t: Translator): LinkOutcomeView {
	switch (outcome.kind) {
		case 'finished':
			return { tone: 'success', message: t('archive.outcome.finished') };
		case 'not-found':
			return { tone: 'warning', message: t('archive.outcome.notFound') };
		case 'already-finished':
			return { tone: 'neutral', message: t('archive.outcome.alreadyFinished') };
		case 'write-failed':
			return { tone: 'error', message: t('library.outcome.finishWriteFailed') };
	}
}

function sealView(state: ResourceState, t: Translator): ResourceCardView['seal'] {
	if (state === 'processed') return { sealed: true, text: t('archive.seal.sealed') };
	if (state === 'takeaway-missing') return { sealed: false, text: t('archive.seal.missing') };
	return { sealed: false, text: t('archive.seal.later') };
}
