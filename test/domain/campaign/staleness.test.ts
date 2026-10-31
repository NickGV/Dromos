import { describe, expect, it } from 'vitest';
import { DEFAULT_STALE_AFTER_DAYS, daysSince, isStale, lastActivity } from '../../../src/domain/campaign/staleness';
import { campaign, task } from './campaignFixtures';

const TODAY = '2026-10-30';

describe('daysSince', () => {
	it('counts calendar days between two YYYY-MM-DD dates', () => {
		expect(daysSince('2026-10-30', '2026-10-30')).toBe(0);
		expect(daysSince('2026-10-17', '2026-10-30')).toBe(13);
		expect(daysSince('2026-10-16', '2026-10-30')).toBe(14);
		expect(daysSince('2026-02-27', '2026-03-02')).toBe(3);
	});
});

describe('lastActivity', () => {
	it('is the latest completion date among the tasks', () => {
		const kairos = campaign({
			tasks: [task('a', null, { completed: true, completedOn: '2026-10-01' }), task('b', null, { completed: true, completedOn: '2026-10-20' })],
		});

		expect(lastActivity(kairos)).toBe('2026-10-20');
	});

	it('falls back to created when nothing was ever completed', () => {
		expect(lastActivity(campaign({ created: '2026-08-01', tasks: [task('a', null)] }))).toBe('2026-08-01');
	});

	it('ignores completed tasks without a date', () => {
		const kairos = campaign({ created: '2026-08-01', tasks: [task('a', null, { completed: true, completedOn: null })] });

		expect(lastActivity(kairos)).toBe('2026-08-01');
	});
});

describe('isStale', () => {
	const worked = (completedOn: string, overrides = {}) =>
		campaign({ created: '2026-01-01', tasks: [task('a', null, { completed: true, completedOn })], ...overrides });

	it('uses 14 days as the default threshold', () => {
		expect(DEFAULT_STALE_AFTER_DAYS).toBe(14);
	});

	it('is not stale at 13 days and stale at exactly 14', () => {
		expect(isStale(worked('2026-10-17'), TODAY)).toBe(false);
		expect(isStale(worked('2026-10-16'), TODAY)).toBe(true);
	});

	it('counts from created when nothing was ever completed', () => {
		expect(isStale(campaign({ created: '2026-10-17' }), TODAY)).toBe(false);
		expect(isStale(campaign({ created: '2026-10-16' }), TODAY)).toBe(true);
	});

	it('prefers the campaign threshold over the plugin default', () => {
		expect(isStale(worked('2026-10-25', { staleAfterDays: 5 }), TODAY)).toBe(true);
		expect(isStale(worked('2026-10-17', { staleAfterDays: 30 }), TODAY)).toBe(false);
	});

	it('uses the plugin setting passed in when the campaign has none', () => {
		expect(isStale(worked('2026-10-25'), TODAY, 5)).toBe(true);
	});

	it('only active campaigns can be stale', () => {
		expect(isStale(worked('2026-01-01', { status: 'paused' }), TODAY)).toBe(false);
	});
});
