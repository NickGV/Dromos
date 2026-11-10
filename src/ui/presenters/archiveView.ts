import { compareByFinished, compareBySaved, daysSince, RESOURCE_KINDS, resourceState, resourceVerb, type Resource, type ResourceKind, type ResourceState, type ResourceVerb } from '../../domain';
import { plural, type MessageKey, type Translator } from '../../i18n';
import { limitRows, type ListToggleView } from './listLimit';

/** What the archive's list shows: every resource, "Todos", or one pigeonhole's kind (M8 S4). */
export type ArchiveFilter = 'all' | ResourceKind;

/** The doorway "El archivo" in the reading room (M8 S2): one button that opens the archive. */
export interface ArchiveDoorView {
	readonly name: string;
	/** "7 pendientes": what is not processed yet, on its own line under the name. */
	readonly countText: string;
	readonly openLabel: string;
}

/** The archive, a level of the library shown in place of the room (M8 S5). */
export interface ArchiveView {
	/** "Biblioteca · El archivo", the header card's title. */
	readonly title: string;
	/** The visible back link, "Biblioteca", and its accessible name. */
	readonly backLabel: string;
	readonly backAria: string;
	/** The filter on show: the one asked for, or "Todos" once its pigeonhole is gone. */
	readonly filter: ArchiveFilter;
	/** The accessible name of the group of pigeonholes. */
	readonly pigeonholesLabel: string;
	/** "Todos", then one per kind with at least one resource, in `RESOURCE_KINDS` order; none in an empty archive. */
	readonly pigeonholes: readonly PigeonholeView[];
	/** "4 por leer · 2 por ver · 1 falta procesar · 12 procesados", of the whole archive; `null` when it is empty. */
	readonly summary: string | null;
	/** "No hay nada pendiente…" while the list on show has nothing left to process; else `null`. */
	readonly empty: string | null;
	/** Pending, missing what it left, processed, in that order; a section with no row is left out. */
	readonly sections: readonly ArchiveSectionView[];
}

/** One pigeonhole of the worktable: a filter button with its kind and its count. */
export interface PigeonholeView {
	readonly id: ArchiveFilter;
	/** "Artículos", "Todos". */
	readonly label: string;
	/** The resources not processed yet, pending or missing what they left. */
	readonly count: number;
	readonly selected: boolean;
}

export interface ArchiveSectionView {
	readonly id: ResourceState;
	/** "Por leer y ver", "Falta lo que te dejó", "Procesados". */
	readonly title: string;
	readonly rows: readonly ResourceRowView[];
	/** "Ver más (N)" under the processed ones past the first six; absent elsewhere. */
	readonly more?: ListToggleView;
}

/** One resource in the list: its kind and state in words, its title opens its card. */
export interface ResourceRowView {
	readonly path: string;
	readonly title: string;
	/** `null` draws the plain object of "Sin tipo". */
	readonly kind: ResourceKind | null;
	readonly kindLabel: string;
	readonly state: ResourceState;
	readonly stateLabel: string;
	/** "Martin Fowler · martinfowler.com", either part alone, or `null` with neither. */
	readonly source: string | null;
	/** "Guardado hace 3 días". */
	readonly saved: string;
	/** "Me sirve para: …", or `null` without a `why`. */
	readonly why: string | null;
	/** "Abrir ↗", only for a resource with a link. */
	readonly link: { readonly href: string; readonly label: string; readonly ariaLabel: string } | null;
	/** "Abrir la ficha de <title>", the title button's accessible name. */
	readonly openLabel: string;
}

const PIGEONHOLE_LABELS: Readonly<Record<ResourceKind, MessageKey>> = {
	post: 'archive.pigeonhole.post',
	paper: 'archive.pigeonhole.paper',
	video: 'archive.pigeonhole.video',
	podcast: 'archive.pigeonhole.podcast',
	tool: 'archive.pigeonhole.tool',
	course: 'archive.pigeonhole.course',
};

const KIND_LABELS: Readonly<Record<ResourceKind, MessageKey>> = {
	post: 'archive.kind.post',
	paper: 'archive.kind.paper',
	video: 'archive.kind.video',
	podcast: 'archive.kind.podcast',
	tool: 'archive.kind.tool',
	course: 'archive.kind.course',
};

const MISSING_LABELS: Readonly<Record<ResourceVerb, MessageKey>> = {
	read: 'archive.state.missing.read',
	watch: 'archive.state.missing.watch',
	listen: 'archive.state.missing.listen',
};

/** The sections of the list, in the order they are drawn, each with its order (S5). */
const SECTIONS: readonly { readonly id: ResourceState; readonly title: MessageKey; readonly order: (left: Resource, right: Resource) => number }[] = [
	{ id: 'pending', title: 'archive.section.pending', order: compareBySaved },
	{ id: 'takeaway-missing', title: 'archive.section.missing', order: compareBySaved },
	{ id: 'processed', title: 'archive.section.processed', order: compareByFinished },
];

/** "Artículo", or "Sin tipo" for a `sourceType` the archive does not file. */
export function resourceKindLabel(kind: ResourceKind | null, t: Translator): string {
	return t(kind === null ? 'archive.kind.none' : KIND_LABELS[kind]);
}

/** "Pendiente", "Leído · falta lo que te dejó" (visto, escuchado by the kind's verb) or "Procesado". */
export function resourceStateLabel(resource: Resource, t: Translator): string {
	const state = resourceState(resource);
	if (state === 'pending') return t('archive.state.pending');
	if (state === 'processed') return t('archive.state.processed');
	return t(MISSING_LABELS[resourceVerb(resource.kind)]);
}

/** The host of a link without "www.", "martinfowler.com"; `null` for text that is no link. */
export function linkDomain(url: string): string | null {
	try {
		return new URL(url).hostname.replace(/^www\./, '') || null;
	} catch {
		return null;
	}
}

/** "Martin Fowler · martinfowler.com": the author and the link's domain, either alone, or `null` with neither. */
export function resourceSource(resource: Pick<Resource, 'author' | 'url'>): string | null {
	const parts = [resource.author, resource.url === null ? null : linkDomain(resource.url)].filter((part): part is string => part !== null);
	return parts.length === 0 ? null : parts.join(' · ');
}

/** The doorway "El archivo" (M8 S2), with the count of what is not processed yet. */
export function archiveDoorView(resources: readonly Resource[], t: Translator): ArchiveDoorView {
	const open = resources.filter((resource) => resourceState(resource) !== 'processed').length;
	return {
		name: t('archive.door'),
		countText: open === 0 ? t('archive.door.none') : plural(t, 'archive.door.count', open),
		openLabel: open === 0 ? t('archive.door.open.none') : t('archive.door.open', { count: plural(t, 'archive.door.count', open) }),
	};
}

/**
 * The archive (M8 S4, S5): the pigeonholes, the summary of the whole archive, and the list of the
 * pigeonhole `filter`, in three sections, the processed folded under "Ver más (N)" unless
 * `expanded`. A resource of no known kind ("Sin tipo") has no pigeonhole: it shows under "Todos"
 * only. A `filter` whose pigeonhole is gone (its last resource left) falls back to "Todos".
 */
export function archiveView(resources: readonly Resource[], today: string, options: { readonly filter: ArchiveFilter; readonly expanded: boolean }, t: Translator): ArchiveView {
	const kinds = RESOURCE_KINDS.filter((kind) => resources.some((resource) => resource.kind === kind));
	const filter: ArchiveFilter = options.filter !== 'all' && kinds.includes(options.filter) ? options.filter : 'all';
	const shown = filter === 'all' ? resources : resources.filter((resource) => resource.kind === filter);
	const sections = SECTIONS.flatMap((section): ArchiveSectionView[] => {
		const rows = shown.filter((resource) => resourceState(resource) === section.id).sort(section.order).map((resource) => resourceRowView(resource, today, t));
		if (rows.length === 0) return [];
		if (section.id !== 'processed') return [{ id: section.id, title: t(section.title), rows }];
		const limited = limitRows(rows, options.expanded, t, () => false);
		return [{ id: section.id, title: t(section.title), rows: limited.rows, ...(limited.more ? { more: limited.more } : {}) }];
	});
	const pigeonholes: PigeonholeView[] =
		resources.length === 0
			? []
			: [
					{ id: 'all', label: t('archive.all'), count: unprocessed(resources), selected: filter === 'all' },
					...kinds.map((kind) => ({ id: kind, label: t(PIGEONHOLE_LABELS[kind]), count: unprocessed(resources.filter((resource) => resource.kind === kind)), selected: filter === kind })),
				];
	return {
		title: t('archive.title'),
		backLabel: t('library.back'),
		backAria: t('library.back.aria'),
		filter,
		pigeonholesLabel: t('archive.pigeonholes'),
		pigeonholes,
		summary: resources.length === 0 ? null : summaryText(resources, t),
		empty: unprocessed(shown) === 0 ? t('archive.empty') : null,
		sections,
	};
}

function unprocessed(resources: readonly Resource[]): number {
	return resources.filter((resource) => resourceState(resource) !== 'processed').length;
}

function summaryText(resources: readonly Resource[], t: Translator): string {
	const pending = resources.filter((resource) => resourceState(resource) === 'pending');
	const byVerb = (verb: ResourceVerb): number => pending.filter((resource) => resourceVerb(resource.kind) === verb).length;
	const missing = resources.filter((resource) => resourceState(resource) === 'takeaway-missing').length;
	const processed = resources.length - pending.length - missing;
	return [
		byVerb('read') > 0 ? t('archive.summary.read', { count: byVerb('read') }) : null,
		byVerb('watch') > 0 ? t('archive.summary.watch', { count: byVerb('watch') }) : null,
		byVerb('listen') > 0 ? t('archive.summary.listen', { count: byVerb('listen') }) : null,
		missing > 0 ? plural(t, 'archive.summary.missing', missing) : null,
		processed > 0 ? plural(t, 'archive.summary.processed', processed) : null,
	]
		.filter((part): part is string => part !== null)
		.join(' · ');
}

/** "Guardado hace 3 días", "hace 1 día", "hoy" (a date ahead reads as today); a date it cannot read is written as it is. */
function savedText(saved: string, today: string, t: Translator): string {
	const days = daysSince(saved, today);
	if (!Number.isFinite(days)) return t('archive.card.saved', { date: saved });
	if (days <= 0) return t('archive.saved.today');
	return plural(t, 'archive.saved', days);
}

function resourceRowView(resource: Resource, today: string, t: Translator): ResourceRowView {
	return {
		path: resource.path,
		title: resource.title,
		kind: resource.kind,
		kindLabel: resourceKindLabel(resource.kind, t),
		state: resourceState(resource),
		stateLabel: resourceStateLabel(resource, t),
		source: resourceSource(resource),
		saved: savedText(resource.saved, today, t),
		why: resource.why === null ? null : t('archive.why', { why: resource.why }),
		link: resource.url === null ? null : { href: resource.url, label: t('archive.open'), ariaLabel: t('archive.open.aria', { title: resource.title }) },
		openLabel: t('library.openCard', { title: resource.title }),
	};
}
