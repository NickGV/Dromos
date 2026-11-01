import { describe, expect, it } from 'vitest';
import { dateOrNull, positiveInteger } from '../../../src/adapters/vault/frontmatterFields';

describe('dateOrNull', () => {
	it('keeps the day of a date or a date-time text', () => {
		expect(dateOrNull('2026-11-03')).toBe('2026-11-03');
		expect(dateOrNull('2026-11-03T08:30:00.000Z')).toBe('2026-11-03');
	});

	it('reads a Date object as its local day, in case a YAML reader turns the text into one', () => {
		expect(dateOrNull(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03');
		expect(dateOrNull(new Date(2026, 0, 9))).toBe('2026-01-09');
	});

	it.each([undefined, null, '', 'soon', 20261103, {}, new Date(Number.NaN)])('reads %s as no date', (value) => {
		expect(dateOrNull(value)).toBeNull();
	});
});

describe('positiveInteger', () => {
	it('accepts a positive integer, as a number or as digits in a text', () => {
		expect(positiveInteger(30)).toBe(30);
		expect(positiveInteger('30')).toBe(30);
		expect(positiveInteger(' 14 ')).toBe(14);
	});

	it.each([0, -1, 2.5, '0', '2.5', '-3', 'ten', '', null, undefined, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (value) => {
		expect(positiveInteger(value)).toBeNull();
	});
});
