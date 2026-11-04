import { describe, expect, it } from 'vitest';
import { localDate } from '../../src/adapters/habitica/questMapper';
import { DROMOS_TIME_ZONE, localDateOf } from '../../src/adapters/localDate';
import { SystemClock } from '../../src/adapters/obsidian/SystemClock';

// Around midnight in Bogota (05:00 UTC), at midnight UTC, and across a month and a year.
const INSTANTS = ['2026-10-30T00:00:00.000Z', '2026-10-31T04:59:59.999Z', '2026-10-31T05:00:00.000Z', '2027-01-01T04:00:00.000Z', '2027-02-01T05:00:00.000Z'];

describe('localDateOf: the one source for the time zone (S1)', () => {
	it('reads the calendar day in America/Bogota', () => {
		expect(DROMOS_TIME_ZONE).toBe('America/Bogota');
		expect(localDateOf(new Date('2026-10-31T04:59:59.999Z'))).toBe('2026-10-30');
		expect(localDateOf(new Date('2026-10-31T05:00:00.000Z'))).toBe('2026-10-31');
	});

	it("agrees with the clock's today and with the dates read from Habitica at every instant", () => {
		for (const iso of INSTANTS) {
			const instant = new Date(iso);
			expect(new SystemClock(() => instant).today()).toBe(localDateOf(instant));
			expect(localDate(iso)).toBe(localDateOf(instant));
		}
	});
});
