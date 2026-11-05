import { describe, expect, it } from 'vitest';
import { isMission, MISSION_MIN_SUBTASKS } from '../../../src/domain';

describe('isMission (missions S1)', () => {
	it('makes a task with 3 or more subtasks a mission', () => {
		expect(MISSION_MIN_SUBTASKS).toBe(3);
		expect(isMission({ done: 0, total: 3 })).toBe(true);
		expect(isMission({ done: 13, total: 13 })).toBe(true);
	});

	it('keeps a task with fewer subtasks, or none, a plain task', () => {
		expect(isMission({ done: 1, total: 2 })).toBe(false);
		expect(isMission({ done: 0, total: 0 })).toBe(false);
		expect(isMission(undefined)).toBe(false);
	});
});
