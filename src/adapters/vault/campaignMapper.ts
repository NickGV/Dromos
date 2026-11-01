import {
	comparePriority,
	type Campaign,
	DEFAULT_HABIT_DAYS,
	type CampaignHabit,
	type CampaignKind,
	type CampaignTask,
	type LifecycleStatus,
	type Phase,
	type Priority,
} from '../../domain';
import { asRecord, dateOrNull, fileName, nonEmpty, oneOf, positiveInteger } from './frontmatterFields';
import { habiticaIdFrom } from './habiticaId';

/** A markdown note as the mapper sees it: no `obsidian` types, so it is testable. */
export interface VaultNote {
	/** Vault-relative path. */
	readonly path: string;
	/** Parsed frontmatter, or `undefined` when the note has none. */
	readonly frontmatter: unknown;
	/** Local creation date (`YYYY-MM-DD`) of the file, used when `created` is missing or invalid. */
	readonly createdOn: string;
	/**
	 * Study sessions only: the path the `research` wikilink resolves to, or `null` when it
	 * does not resolve. Absent when the caller could not resolve links. It tells apart two
	 * research notes that share a file name.
	 */
	readonly researchPath?: string | null;
}

const STATUSES: readonly LifecycleStatus[] = ['planning', 'active', 'paused', 'completed', 'archived'];
const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];
const DEFAULT_PRIORITY: Priority = 'low';
/** `04-Game-Design`, Campaign: a project is the README of `02 - Projects/<Project>/`. */
const PROJECT_README = /^02 - Projects\/[^/]+\/README\.md$/;
/** `04-Game-Design`, Campaign: a research lives under `03 - Areas/<Area>/Estudio/`. */
const RESEARCH_FOLDER = /^03 - Areas\/[^/]+\/Estudio\//;

/**
 * True for an active campaign note (Q023): an `index` that is the README of a
 * project folder, or a `research` under an area's `Estudio` folder. The path rule
 * keeps other active `index` or `research` notes (maps, audits, templates) out.
 */
export function isCampaignNote(note: VaultNote, status: LifecycleStatus = 'active'): boolean {
	const fields = asRecord(note.frontmatter);
	if (fields.status !== status) return false;
	if (fields.type === 'index') return PROJECT_README.test(note.path);
	if (fields.type === 'research') return RESEARCH_FOLDER.test(note.path);
	return false;
}

/**
 * What a wikilink points to, folder included, without alias or heading
 * (`[[Folder/Note#Heading|alias]]` gives `Folder/Note`), or `null` when the value is not a link.
 */
export function linkPath(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const inner = /^\[\[([^\]]*)\]\]$/.exec(value.trim())?.[1];
	if (inner === undefined) return null;
	const target = ((inner.split('|')[0] ?? '').split('#')[0] ?? '').trim();
	return target === '' ? null : target;
}

/** The file name a wikilink points to, without folder, alias or heading, or `null`. */
export function linkTarget(value: unknown): string | null {
	const name = linkPath(value)?.split('/').pop()?.trim() ?? '';
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
		status: oneOf(STATUSES, fields.status) ?? 'active',
		priority: oneOf(PRIORITIES, fields.priority) ?? DEFAULT_PRIORITY,
		area: linkTarget(fields.area) ?? nonEmpty(fields.area),
		skills: skillsFrom(fields.skill),
		deadline: dateOrNull(fields.deadline),
		staleAfterDays: positiveInteger(fields.stale_after_days),
		created: dateOrNull(fields.created) ?? note.createdOn,
		phases: phasesFrom(fields.phases),
		tasks: kind === 'research' ? sessionTasks(note.path, name, sessions) : projectTasks(fields.tasks),
		habits: kind === 'research' ? [] : habitsFrom(fields.habits),
	};
}

/** The pure core of `listActive`: active campaigns of `notes`, sorted by priority then title. */
export function buildActiveCampaigns(notes: readonly VaultNote[]): Campaign[] {
	return notes
		.filter((note) => isCampaignNote(note))
		.map((note) => campaignFromNote(note, notes))
		.sort((left, right) => comparePriority(left.priority, right.priority) || left.title.localeCompare(right.title));
}

/** `skill` is a single id or a list of ids; both read as a list of lowercase ids (like the tags), and an empty text or `null` is no skill. */
function skillsFrom(value: unknown): string[] {
	const items = Array.isArray(value) ? value : [value];
	return [...new Set(items.flatMap((item: unknown) => (typeof item === 'string' && item.trim() !== '' ? [item.trim().toLowerCase()] : [])))];
}

/** The completed campaigns of `notes`: the ones that count toward the `campaigns` requirement of a skill. */
export function buildCompletedCampaigns(notes: readonly VaultNote[]): Campaign[] {
	return notes
		.filter((note) => isCampaignNote(note, 'completed'))
		.map((note) => campaignFromNote(note, notes))
		.sort((left, right) => left.title.localeCompare(right.title));
}

function habitsFrom(value: unknown): CampaignHabit[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((entry: unknown) => {
		const fields = asRecord(entry);
		const title = nonEmpty(fields.title);
		if (title === null) return [];
		return [
			{
				title: title.trim(),
				days: positiveInteger(fields.days) ?? DEFAULT_HABIT_DAYS,
				skills: skillsFrom(fields.skill),
				habiticaId: habiticaIdFrom(fields.habitica_id),
				streak: null,
			},
		];
	});
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
				habiticaId: habiticaIdFrom(fields.habitica_id),
				skills: skillsFrom(fields.skill),
				resources: Array.isArray(fields.resources) ? fields.resources.filter((item): item is string => typeof item === 'string') : [],
				completed: false,
				completedOn: null,
			},
		];
	});
}

/**
 * Sessions of one research, ordered by `session` then title. A session belongs to it when its
 * link resolved to this note's path; when the link did not resolve (or the caller could not
 * resolve links) the file name decides. Completed means `status: completed` (ADR-012).
 */
function sessionTasks(researchPath: string, researchName: string, sessions: readonly VaultNote[]): CampaignTask[] {
	return sessions
		.filter((note) => {
			const fields = asRecord(note.frontmatter);
			if (fields.type !== 'study-session') return false;
			if (typeof note.researchPath === 'string') return note.researchPath === researchPath;
			return linkTarget(fields.research) === researchName;
		})
		.map((note) => {
			const fields = asRecord(note.frontmatter);
			const completed = fields.status === 'completed';
			const created = dateOrNull(fields.created) ?? note.createdOn;
			return {
				order: positiveInteger(fields.session) ?? 0,
				task: {
					title: fileName(note.path),
					phase: nonEmpty(fields.phase),
					habiticaId: habiticaIdFrom(fields.habitica_id),
					skills: [],
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
