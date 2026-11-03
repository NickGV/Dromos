import { describe, expect, it } from 'vitest';
import { createTranslator } from '../../src/i18n';
import { BRIEFING_READ_KEY, openLetter, storedLetterMark } from '../../src/ui/containers/briefingLetter';
import { shortHash } from '../../src/ui/presenters/briefingText';
import { briefingView } from '../../src/ui/presenters/briefingView';
import { aBriefing } from '../fakes/InMemoryBriefingRepository';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';

const en = createTranslator('en');
const TODAY = '2026-11-03';

// game-ui S13: opening the letter marks it read on this device, through the device-store port.
describe('openLetter', () => {
	it('writes the read mark, the letter\'s date and the hash of its body, under briefing-read', () => {
		const store = new InMemoryDeviceStore();
		const briefing = aBriefing({ created: '2026-11-02', body: 'Shalom.' });

		const mark = openLetter({ kind: 'found', briefing }, store);

		expect(BRIEFING_READ_KEY).toBe('briefing-read');
		expect(mark).toEqual({ date: '2026-11-02', hash: shortHash('Shalom.') });
		expect(store.writes).toEqual([['briefing-read', { date: '2026-11-02', hash: shortHash('Shalom.') }]]);
	});

	it('takes the seal off: the view of the same letter with the stored mark is no longer new', () => {
		const store = new InMemoryDeviceStore();
		const state = { kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Shalom.' }) } as const;

		expect(briefingView(state, TODAY, [], en, storedLetterMark(store)).newLabel).toBe('New letter');
		openLetter(state, store);
		expect(briefingView(state, TODAY, [], en, storedLetterMark(store)).newLabel).toBeNull();
	});

	it('shows the seal again when Esdras writes a new letter', () => {
		const store = new InMemoryDeviceStore();
		openLetter({ kind: 'found', briefing: aBriefing({ created: '2026-11-02', body: 'Ayer.' }) }, store);

		const next = { kind: 'found', briefing: aBriefing({ created: TODAY, body: 'Hoy.' }) } as const;

		expect(briefingView(next, TODAY, [], en, storedLetterMark(store)).newLabel).toBe('New letter');
	});

	it('writes nothing when there is no letter to open', () => {
		const store = new InMemoryDeviceStore();

		expect(openLetter({ kind: 'missing' }, store)).toBeNull();
		expect(openLetter(null, store)).toBeNull();
		expect(store.writes).toEqual([]);
	});

	it('reads the mark this device kept, or nothing', () => {
		expect(storedLetterMark(new InMemoryDeviceStore())).toBeNull();
		expect(storedLetterMark(new InMemoryDeviceStore({ 'briefing-read': { date: TODAY, hash: 'abcdef01' } }))).toEqual({ date: TODAY, hash: 'abcdef01' });
	});
});
