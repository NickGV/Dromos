import type { Area } from '../../domain';
import { habitsFrom, skillsFrom, type VaultNote } from './campaignMapper';
import { asRecord, fileName, nonEmpty } from './frontmatterFields';

/** True for an area hub (ADR-017): an `archeion` note whose `status` is not `archived`; a missing status counts as not archived. */
export function isAreaNote(note: VaultNote): boolean {
	const fields = asRecord(note.frontmatter);
	return fields.type === 'archeion' && fields.status !== 'archived';
}

/** Maps one area note: its title (or the file name), its skills and its habits, read as a campaign's are. Never throws. */
export function areaFromNote(note: VaultNote): Area {
	const fields = asRecord(note.frontmatter);
	return {
		path: note.path,
		title: nonEmpty(fields.title) ?? fileName(note.path),
		skills: skillsFrom(fields.skill),
		habits: habitsFrom(fields.habits),
	};
}

/** The pure core of `listAreas`: the area notes of `notes`, sorted by title. */
export function buildAreas(notes: readonly VaultNote[]): Area[] {
	return notes
		.filter((note) => isAreaNote(note))
		.map((note) => areaFromNote(note))
		.sort((left, right) => left.title.localeCompare(right.title));
}
