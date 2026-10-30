import { describe, expect, it } from 'vitest';
import { SystemClock } from '../../../src/adapters/obsidian/SystemClock';

function clockAt(iso: string): SystemClock {
	return new SystemClock(() => new Date(iso));
}

describe('SystemClock.today', () => {
	it('is still the previous day in Bogota a few hours after midnight UTC', () => {
		expect(clockAt('2026-10-31T03:00:00Z').today()).toBe('2026-10-30');
	});

	it('changes day exactly at midnight in Bogota (05:00 UTC)', () => {
		expect(clockAt('2026-10-31T04:59:59Z').today()).toBe('2026-10-30');
		expect(clockAt('2026-10-31T05:00:00Z').today()).toBe('2026-10-31');
	});

	it('crosses month and year boundaries with zero-padded fields', () => {
		expect(clockAt('2027-01-01T04:00:00Z').today()).toBe('2026-12-31');
		expect(clockAt('2027-02-01T05:00:00Z').today()).toBe('2027-02-01');
	});

	it('uses the system clock by default', () => {
		expect(new SystemClock().today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe('SystemClock.now', () => {
	it('returns the injected instant', () => {
		expect(clockAt('2026-10-31T03:00:00Z').now().toISOString()).toBe('2026-10-31T03:00:00.000Z');
	});
});
