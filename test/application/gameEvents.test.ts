import { describe, expect, it } from 'vitest';
import { detectEvents, type SkillChange } from '../../src/application/gameEvents';
import { skillStanding } from '../../src/domain';
import { skill } from '../domain/skill/skillFixtures';

const ranks = [0, 1, 2, 3, 4].map((index) => ({ name: `Rank ${index}`, description: '' }));
const reader = skill({ id: 'lector', name: 'Lector', ranks, unlocked: true, unlockedOn: '2026-11-01' });
// XP that leaves a skill at level 4 and at level 5 (100 + 246 + 417 + 606 = 1369).
const AT_LEVEL_4 = 1000;
const AT_LEVEL_5 = 1369;

function change(overrides: Partial<SkillChange> = {}): SkillChange {
	return { skill: reader, justUnlocked: false, before: skillStanding(true, 0), after: skillStanding(true, 0), ...overrides };
}

describe('detectEvents', () => {
	it('reports nothing when no level changed', () => {
		expect(detectEvents(3, 3, [change()])).toEqual([]);
	});

	it('reports the new level of the character first', () => {
		expect(detectEvents(2, 3, [])).toEqual([{ kind: 'character-level', level: 3 }]);
	});

	it('never reports a level that went down', () => {
		expect(detectEvents(3, 2, [change({ before: skillStanding(true, AT_LEVEL_5), after: skillStanding(true, AT_LEVEL_4) })])).toEqual([]);
	});

	it('reports an unlock once and not as a level-up', () => {
		const unlocked = change({ justUnlocked: true, before: skillStanding(false, 0), after: skillStanding(true, 0) });

		expect(detectEvents(1, 1, [unlocked])).toEqual([{ kind: 'skill-unlocked', skillId: 'lector', name: 'Lector' }]);
	});

	it('reports a level-up inside a rank without a rank change', () => {
		const up = change({ before: skillStanding(true, 0), after: skillStanding(true, 100) });

		expect(detectEvents(1, 1, [up])).toEqual([{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 2, rank: 'Rank 0', rankChanged: false }]);
	});

	it('reports the rank change when the level crosses a rank threshold', () => {
		const up = change({ before: skillStanding(true, AT_LEVEL_4), after: skillStanding(true, AT_LEVEL_5) });

		expect(detectEvents(1, 1, [up])).toEqual([{ kind: 'skill-level', skillId: 'lector', name: 'Lector', level: 5, rank: 'Rank 1', rankChanged: true }]);
	});

	it('names no rank when the note does not describe it', () => {
		const bare = change({ skill: skill({ id: 'lector', name: 'Lector' }), before: skillStanding(true, 0), after: skillStanding(true, 100) });

		expect(detectEvents(1, 1, [bare])).toMatchObject([{ kind: 'skill-level', rank: null }]);
	});

	it('lists the skills in the order given, after the character', () => {
		const other = skill({ id: 'atleta', name: 'Atleta' });
		const events = detectEvents(1, 2, [
			change({ skill: other, justUnlocked: true, before: skillStanding(false, 0), after: skillStanding(true, 0) }),
			change({ before: skillStanding(true, 0), after: skillStanding(true, 100) }),
		]);

		expect(events.map((event) => event.kind)).toEqual(['character-level', 'skill-unlocked', 'skill-level']);
	});
});
