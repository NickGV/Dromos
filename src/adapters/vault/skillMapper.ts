import { RANK_COUNT, STAT_IDS, skillTag, type Requirement, type Skill, type SkillRank, type StatId } from '../../domain';
import { asRecord, dateOrNull, fileName, nonEmpty, oneOf, positiveInteger } from './frontmatterFields';

/** A note as the skill mapper sees it: no `obsidian` types, so it is testable. */
export interface SkillNote {
	/** Vault-relative path. */
	readonly path: string;
	/** Parsed frontmatter, or `undefined` when the note has none. */
	readonly frontmatter: unknown;
}

export type SkillReadResult =
	| { readonly kind: 'skill'; readonly skill: Skill }
	| { readonly kind: 'invalid'; readonly path: string; readonly reason: string };

export interface InvalidSkillNote {
	readonly path: string;
	readonly reason: string;
}

export interface BuiltSkills {
	readonly skills: readonly Skill[];
	readonly invalid: readonly InvalidSkillNote[];
}

const SKILL_NOTE_TYPE = 'dromos-skill';

export function isSkillNote(note: SkillNote): boolean {
	return asRecord(note.frontmatter).type === SKILL_NOTE_TYPE;
}

/**
 * Maps `Dromos/Skills/<id>.md` (S4, S6). The file name is the id. The derived fields
 * (`level`, `xp`, `xp_to_next`) are ignored: Dromos recomputes them. A note is either
 * read whole or reported as invalid: a requirement that cannot be read is never
 * skipped, because skipping it would make the skill easier to unlock.
 */
export function skillFromNote(note: SkillNote): SkillReadResult {
	const fields = asRecord(note.frontmatter);
	const name = fileName(note.path);
	const id = nonEmpty(fields.id) ?? name;
	const fail = (reason: string): SkillReadResult => ({ kind: 'invalid', path: note.path, reason });

	if (id !== name) return fail(`The id "${id}" does not match the file name "${name}".`);
	const stat = oneOf<StatId>(STAT_IDS, fields.stat);
	if (stat === null) return fail(`Unknown stat "${String(fields.stat)}".`);
	const tag = skillTag(id);
	if (fields.habitica_tag !== undefined && fields.habitica_tag !== tag) return fail(`The Habitica tag must be "${tag}".`);
	const requirements = requirementsFrom(fields.requirements);
	if (typeof requirements === 'string') return fail(requirements);

	const unlocked = fields.unlocked === true;
	return {
		kind: 'skill',
		skill: {
			id,
			name: nonEmpty(fields.name) ?? id,
			icon: typeof fields.icon === 'string' ? fields.icon : '',
			stat,
			description: typeof fields.description === 'string' ? fields.description : '',
			habiticaTag: tag,
			ranks: ranksFrom(fields.ranks),
			requirements,
			unlocked,
			unlockedOn: unlocked ? dateOrNull(fields.unlocked_on) : null,
		},
	};
}

/** The skill notes of `notes`, valid ones sorted by id, the others reported with the reason. */
export function buildSkills(notes: readonly SkillNote[]): BuiltSkills {
	const skills: Skill[] = [];
	const invalid: InvalidSkillNote[] = [];
	for (const note of notes.filter(isSkillNote)) {
		const result = skillFromNote(note);
		if (result.kind === 'skill') skills.push(result.skill);
		else invalid.push({ path: result.path, reason: result.reason });
	}
	return { skills: skills.sort((left, right) => left.id.localeCompare(right.id)), invalid };
}

function ranksFrom(value: unknown): SkillRank[] {
	if (!Array.isArray(value)) return [];
	return value
		.flatMap((entry: unknown) => {
			const fields = asRecord(entry);
			const name = nonEmpty(fields.name);
			return name === null ? [] : [{ name, description: typeof fields.description === 'string' ? fields.description : '' }];
		})
		.slice(0, RANK_COUNT);
}

/** The requirements, or the reason the list cannot be read (a string). */
function requirementsFrom(value: unknown): Requirement[] | string {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) return 'The requirements must be a list.';
	const requirements: Requirement[] = [];
	for (const [index, entry] of value.entries()) {
		const requirement = requirementFrom(entry);
		if (requirement === null) return `Requirement ${index + 1} is not valid.`;
		requirements.push(requirement);
	}
	return requirements;
}

function requirementFrom(entry: unknown): Requirement | null {
	const fields = asRecord(entry);
	switch (fields.kind) {
		case 'quests':
		case 'campaigns': {
			const count = positiveInteger(fields.count);
			return count === null ? null : { kind: fields.kind, count };
		}
		case 'habit': {
			const days = positiveInteger(fields.days);
			return days === null ? null : { kind: 'habit', days };
		}
		case 'manual': {
			const id = nonEmpty(fields.id);
			const text = nonEmpty(fields.text);
			if (id === null || text === null) return null;
			const confirmed = fields.confirmed === true;
			return { kind: 'manual', id, text, confirmed, confirmedOn: confirmed ? dateOrNull(fields.confirmed_on) : null };
		}
		default:
			return null;
	}
}
