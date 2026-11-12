import type { AvatarStanding } from '../../application';
import { byHighestSkill } from '../../domain';
import { MAX_SKILL_OBJECTS, SKILL_OBJECT_SPOTS, type AvatarView, type ObjectSpot } from './avatar';

/**
 * The figure the plaque and the road draw (M11 S1): the stage reached, and the objects of the highest
 * earned skills, highest first. A skill with no object gives nothing; a skill whose spot a higher
 * skill already took is skipped, and the next one takes its place, up to `MAX_SKILL_OBJECTS`.
 */
export function avatarView(standing: AvatarStanding): AvatarView {
	const taken = new Set<ObjectSpot>();
	const objects: string[] = [];
	for (const { id } of [...standing.skills].sort(byHighestSkill)) {
		if (objects.length === MAX_SKILL_OBJECTS) break;
		const spot = spotOf(id);
		if (spot === null || taken.has(spot)) continue;
		taken.add(spot);
		objects.push(id);
	}
	return { stage: standing.stage, objects };
}

/** The spot of a skill's object; only the table's own entries count, so `constructor` is no skill. */
function spotOf(id: string): ObjectSpot | null {
	return Object.prototype.hasOwnProperty.call(SKILL_OBJECT_SPOTS, id) ? (SKILL_OBJECT_SPOTS[id] ?? null) : null;
}
