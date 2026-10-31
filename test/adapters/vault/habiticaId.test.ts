import { describe, expect, it } from 'vitest';
import { habiticaIdFrom, isUnsentId } from '../../../src/adapters/vault/habiticaId';

describe('isUnsentId', () => {
	it('is true for missing, null and blank text', () => {
		for (const value of [undefined, null, '', '   ', '\n\t']) expect(isUnsentId(value)).toBe(true);
	});

	it('is false for any other value, so an id is never overwritten', () => {
		for (const value of ['abc', ' abc ', 0, 5, false, true, {}, [], ['x']]) expect(isUnsentId(value)).toBe(false);
	});
});

describe('habiticaIdFrom', () => {
	it('returns null for an unsent task and the trimmed text otherwise', () => {
		expect(habiticaIdFrom(undefined)).toBeNull();
		expect(habiticaIdFrom('  ')).toBeNull();
		expect(habiticaIdFrom(' 3f2a ')).toBe('3f2a');
	});

	it('keeps a value that is not text as a value Habitica will not find, so the card warns', () => {
		expect(habiticaIdFrom(5)).toBe('5');
		expect(habiticaIdFrom(false)).toBe('false');
		expect(habiticaIdFrom({})).toBe('[invalid]');
		expect(habiticaIdFrom(['x'])).toBe('[invalid]');
	});
});
