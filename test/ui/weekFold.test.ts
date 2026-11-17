import { describe, expect, it } from 'vitest';
import { storedWeekOpen, toggleWeek, WEEK_OPEN_KEY } from '../../src/ui/containers/weekFold';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';

// app-reports S7: the week card is folded by default and its fold is remembered on this device, as the campaign cards.
describe('the fold of the week card, on this device', () => {
	it('starts folded', () => {
		expect(storedWeekOpen(new InMemoryDeviceStore())).toBe(false);
	});

	it('opens the card, keeping it open under home-week-open', () => {
		const store = new InMemoryDeviceStore();

		expect(toggleWeek(store, false)).toBe(true);
		expect(WEEK_OPEN_KEY).toBe('home-week-open');
		expect(store.writes).toEqual([['home-week-open', true]]);
		expect(storedWeekOpen(store)).toBe(true);
	});

	it('folds it again and remembers that too', () => {
		const store = new InMemoryDeviceStore({ 'home-week-open': true });

		expect(toggleWeek(store, true)).toBe(false);
		expect(storedWeekOpen(store)).toBe(false);
	});

	it('reads any stored value that is not true as folded', () => {
		for (const value of ['true', 1, ['open'], { open: true }, null]) expect(storedWeekOpen(new InMemoryDeviceStore({ 'home-week-open': value })), JSON.stringify(value)).toBe(false);
	});
});
