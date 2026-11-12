import { describe, expect, it } from 'vitest';
import { markTitlesSeen, newTitleNotice, storedTitlesSeen, TITLES_SEEN_KEY } from '../../src/ui/containers/titlesNotice';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';
import { aTitle } from '../fakes/InMemoryTitleRepository';

const CORREDOR = aTitle('corredor', '2026-11-01', { title: 'Corredor' });
const LECTOR = aTitle('lector-constante', '2027-03-14', { title: 'Lector constante' });
const PERSEVERANTE = aTitle('perseverante', '2027-10-21', { title: 'Perseverante' });

// titles S3, S5: a title dated after the last one seen on this device is announced once.
describe('newTitleNotice: the notice of a new title, once per device', () => {
	it('on the very first read on this device marks the titles there seen, with no notice: Corredor alone never brings one', () => {
		const store = new InMemoryDeviceStore();

		expect(newTitleNotice(store, [CORREDOR])).toBeNull();
		expect(TITLES_SEEN_KEY).toBe('titles-seen');
		expect(store.writes).toEqual([['titles-seen', '2026-11-01']]);
	});

	it('announces the newest title granted after the day kept here, and keeps its day at once', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2027-03-14' });

		expect(newTitleNotice(store, [PERSEVERANTE, LECTOR, CORREDOR])).toEqual(PERSEVERANTE);
		expect(storedTitlesSeen(store)).toBe('2027-10-21');
	});

	it('shows once: the next read on this device brings no notice', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2027-03-14' });
		newTitleNotice(store, [PERSEVERANTE, LECTOR, CORREDOR]);

		expect(newTitleNotice(store, [PERSEVERANTE, LECTOR, CORREDOR])).toBeNull();
	});

	it('brings nothing and writes nothing when no title is newer than the day kept here', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2027-10-21' });

		expect(newTitleNotice(store, [PERSEVERANTE, LECTOR, CORREDOR])).toBeNull();
		expect(store.writes).toEqual([]);
	});

	it('takes the newest grant whatever the order it is given in', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2026-11-01' });

		expect(newTitleNotice(store, [CORREDOR, PERSEVERANTE, LECTOR])).toEqual(PERSEVERANTE);
	});

	it('writes nothing while there is no readable title: the first read waits for one', () => {
		const store = new InMemoryDeviceStore();

		expect(newTitleNotice(store, [])).toBeNull();
		expect(store.writes).toEqual([]);
	});

	it('reads a kept value that is not a day as no mark at all', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': { day: '2027-10-21' } });

		expect(storedTitlesSeen(store)).toBeNull();
		expect(newTitleNotice(store, [PERSEVERANTE])).toBeNull();
		expect(storedTitlesSeen(store)).toBe('2027-10-21');
	});
});

describe('markTitlesSeen: opening the card also marks the titles seen (titles S5)', () => {
	it('keeps the newest grant, so no notice of those titles comes after', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2026-11-01' });

		markTitlesSeen(store, [LECTOR, PERSEVERANTE, CORREDOR]);

		expect(storedTitlesSeen(store)).toBe('2027-10-21');
		expect(newTitleNotice(store, [PERSEVERANTE, LECTOR, CORREDOR])).toBeNull();
	});

	it('never moves the kept day back, and writes nothing without a title', () => {
		const store = new InMemoryDeviceStore({ 'titles-seen': '2027-10-21' });

		markTitlesSeen(store, [CORREDOR]);
		markTitlesSeen(store, []);

		expect(store.writes).toEqual([]);
	});
});
