import type { Briefing } from '../../domain';
import { asRecord, dateOrNull, nonEmpty } from './frontmatterFields';

/** The briefing a note holds. Nothing in it is required: a field missing or of the wrong type counts as not written. */
export function briefingFromNote(path: string, frontmatter: unknown, body: string): Briefing {
	const fields = asRecord(frontmatter);
	const mission = asRecord(fields.mission);
	const title = nonEmpty(mission.title);
	return {
		path,
		created: dateOrNull(fields.created),
		mission: title === null ? null : { title, why: nonEmpty(mission.why) },
		nearSkillId: nonEmpty(asRecord(fields.near_unlock).skill),
		body: body.trim(),
	};
}
