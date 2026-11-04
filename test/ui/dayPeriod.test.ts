import { describe, expect, it } from 'vitest';
import { dayPeriod } from '../../src/ui/presenters/dayPeriod';

/** A local time on 3 Nov 2026: the period follows the device's own clock, as the user lives it. */
const at = (hours: number, minutes: number): Date => new Date(2026, 10, 3, hours, minutes);

describe('dayPeriod (game-ui S17)', () => {
	it('turns at 05:00, 08:00, 18:00 and 21:00 local time', () => {
		expect([at(4, 59), at(5, 0), at(7, 59), at(8, 0), at(17, 59), at(18, 0), at(20, 59), at(21, 0)].map(dayPeriod)).toEqual([
			'night',
			'dawn',
			'dawn',
			'day',
			'day',
			'dusk',
			'dusk',
			'night',
		]);
	});

	it('is night from 21:00 through midnight to 05:00', () => {
		expect([at(23, 59), at(0, 0), at(2, 30)].map(dayPeriod)).toEqual(['night', 'night', 'night']);
	});

	it('is day for a clock that gives no valid time', () => {
		expect(dayPeriod(new Date(Number.NaN))).toBe('day');
	});
});
