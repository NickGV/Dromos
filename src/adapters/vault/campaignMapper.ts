import {
	comparePriority,
	type Campaign,
	type CampaignKind,
	type CampaignTask,
	type LifecycleStatus,
	type Phase,
	type Priority,
} from '../../domain';

/** A markdown note as the mapper sees it: no `obsidian` types, so it is testable. */
export interface VaultNote {
	/** Vault-relative path. */
	readonly path: string;
	/** Parsed frontmatter, or `undefined` when the note has none. */
	readonly frontmatter: unknown;
	/** Local creation date (`YYYY-MM-DD`) of the file, used when `created` is missing or invalid. */
	readonly createdOn: string;
}

const STATUSES: readonly LifecycleStatus[] = ['planning', 'active', 'paused', 'completed', 'archived'];
const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
const DEFAULT_PRIORITY: Priority = 'low';
const DATE = /^\d{4}-\d{2}-\d{2}/;
/** `04-Game-Design`, Campaign: a project is the README of `02 - Projects/<Project>/`. */
const PROJECT_README = /^02 - Projects\/[^/]+\/README\.md$/;
/** `04-Game-Design`, Campaign: a research lives under `03 - Areas/<Area>/Estudio/`. */
const RESEARCH_FOLDER = /^03 - Areas\/[^/]+\/Estudio\//;

/**
 * True for an active campaign note (Q023): an `index` that is the README of a
 * project folder, or a `research` under an area's `Estudio` folder. The path rule
 * keeps other active `index` or `research` notes (maps, audits, templates) out.
 */
export function isCampaignNote(note: VaultNote): boolean {
	const fields = asRecord(note.frontmatter);
	if (fields.status !== 'active') return false;
	if (fields.type === 'index') return PROJECT_README.test(note.path);
	if (fields.type === 'research') return RESEARCH_FOLDER.test(note.path);
	return false;
}

/**
 * The file name a wikilink points to, without folder, alias or heading
 * (`[[Folder/Note#Heading|alias]]` gives `Note`), or `null` when the value is not a link.
 */
export function linkTarget(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const inner = /^\[\[([^\]]*)\]\]$/.exec(value.trim())?.[1];
	if (inner === undefined) return null;
	const target = (inner.split('|')[0] ?? '').split('#')[0] ?? '';
	const name = target.split('/').pop()?.trim() ?? '';
	return name === '' ? null : name;
}

/**
 * Maps one campaign note. A research takes its tasks from the study sessions
 * that link to it; a project takes them from its own `tasks[]`. Missing or wrongly
 * typed fields fall back to defaults, never `NaN` and never a throw (A1).
 * Project tasks come back not completed: Habitica decides that later.
 */
export function campaignFromNote(note: VaultNote, sessions: readonly VaultNote[] = []): Campaign {
	const fields = asRecord(note.frontmatter);
	const kind: CampaignKind = fields.type === 'research' ? 'research' : 'project';
	const name = fileName(note.path);

	return {
		kind,
		path: note.path,
		title: nonEmpty(fields.title) ?? name,
		status: 'active',
		priority: oneOf(PRIORITIES, fields.priority) ?? DEFAULT_PRIORITY,
		area: linkTarget(fields.area) ?? nonEmpty(fields.area),
		skill: nonEmpty(fields.skill),
		deadline: dateOrNull(fields.deadline),
		staleAfterDays: positiveInteger(fields.stale_after_days),
		created: dateOrNull(fields.created) ?? note.createdOn,
		phases: phasesFrom(fields.phases),
		tasks: kind === 'research' ? sessionTasks(name, sessions) : projectTasks(fields.tasks),
	};
}

/** The pure core of `listActive`: active campaigns of `notes`, sorted by priority then title. */
export function buildActiveCampaigns(notes: readonly VaultNote[]): Campaign[] {
	return notes
		.filter(isCampaignNote)
		.map((note) => campaignFromNote(note, notes))
		.sort((left, right) => comparePriority(left.priority, right.priority) || left.title.localeCompare(right.title));
}

function phasesFrom(value: unknown): Phase[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry: unknown) => {
		const fields = asRecord(entry);
		const id = nonEmpty(fields.id);
		if (id === null) return [];
		return [{ id, name: nonEmpty(fields.name) ?? id, status: oneOf(STATUSES, fields.status) ?? 'planning' }];
	});
}

function projectTasks(value: unknown): CampaignTask[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry: unknown) => {
		const fields = asRecord(entry);
		const title = nonEmpty(fields.title);
		if (title === null) return [];
		return [
			{
				title,
				phase: nonEmpty(fields.phase),
				habiticaId: nonEmpty(fields.habitica_id),
				skill: nonEmpty(fields.skill),
				resources: Array.isArray(fields.resources) ? fields.resources.filter((item): item is string => typeof item === 'string') : [],
				completed: false,
				completedOn: null,
			},
		];
	});
}

/** Sessions of the research named `researchName`, ordered by `session` then title. Completed means `status: completed` (ADR-012). */
function sessionTasks(researchName: string, sessions: readonly VaultNote[]): CampaignTask[] {
	return sessions
		.filter((note) => asRecord(note.frontmatter).type === 'study-session' && linkTarget(asRecord(note.frontmatter).research) === researchName)
		.map((note) => {
			const fields = asRecord(note.frontmatter);
			const completed = fields.status === 'completed';
			const created = dateOrNull(fields.created) ?? note.createdOn;
			return {
				order: positiveInteger(fields.session) ?? 0,
				task: {
					title: fileName(note.path),
					phase: nonEmpty(fields.phase),
					habiticaId: nonEmpty(fields.habitica_id),
					skill: null,
					resources: [],
					completed,
					// Sessions have no closing date (Esdras): `created` is the only one.
					completedOn: completed ? created : null,
				} satisfies CampaignTask,
			};
		})
		.sort((left, right) => left.order - right.order || left.task.title.localeCompare(right.task.title))
		.map((entry) => entry.task);
}

function fileName(path: string): string {
	return (path.split('/').pop() ?? path).replace(/\.md$/, '');
}

function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function nonEmpty(value: unknown): string | null {
	return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function oneOf<T extends string>(allowed: readonly T[], value: unknown): T | null {
	return allowed.find((candidate) => candidate === value) ?? null;
}

function dateOrNull(value: unknown): string | null {
	return typeof value === 'string' && DATE.test(value) ? value.slice(0, 10) : null;
}

function positiveInteger(value: unknown): number | null {
	return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}
