import type { BriefingState } from '../../application';
import type { DeviceStore } from '../../ports';
import { letterMarkOf, type LetterMark } from '../presenters/briefingView';

/** Where the device keeps the mark of the last letter it opened (the store adds its `dromos:` prefix). */
export const BRIEFING_READ_KEY = 'briefing-read';

/** What this device kept of the last letter it opened, as stored; `null` before the first one. */
export function storedLetterMark(store: DeviceStore): unknown {
	return store.read(BRIEFING_READ_KEY);
}

/**
 * Opening the letter of `briefing` marks it read on this device (game-ui S13), which takes its wax
 * seal off. Answers with the mark it kept, or `null` when there is no letter and nothing was written.
 */
export function openLetter(briefing: BriefingState | null, store: DeviceStore): LetterMark | null {
	if (briefing?.kind !== 'found') return null;
	const mark = letterMarkOf(briefing.briefing);
	store.write(BRIEFING_READ_KEY, mark);
	return mark;
}
