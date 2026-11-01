import type { Skill } from '../../../src/domain/skill/Skill';

export function skill(overrides: Partial<Skill> = {}): Skill {
	return {
		id: 'cuidador',
		name: 'Cuidador',
		icon: '🩺',
		stat: 'vitalidad',
		description: 'You look after your body.',
		habiticaTag: 'skill/cuidador',
		ranks: [],
		requirements: [{ kind: 'quests', count: 5 }],
		unlocked: false,
		unlockedOn: null,
		...overrides,
	};
}
