import { describe, expect, it } from 'vitest';
import { RequestBriefing } from '../../src/application';
import type { Clipboard } from '../../src/ports';

class FakeClipboard implements Clipboard {
	readonly copied: string[] = [];

	constructor(private readonly fails = false) {}

	copy(text: string): Promise<void> {
		if (this.fails) return Promise.reject(new Error('denied'));
		this.copied.push(text);
		return Promise.resolve();
	}
}

describe('RequestBriefing', () => {
	it('copies the command of the job and says so', async () => {
		const clipboard = new FakeClipboard();

		const outcome = await new RequestBriefing(clipboard).execute();

		expect(outcome).toBe('copied');
		expect(clipboard.copied).toEqual(['/dromos-briefing']);
	});

	it('says so when the clipboard refuses, without rejecting', async () => {
		await expect(new RequestBriefing(new FakeClipboard(true)).execute()).resolves.toBe('failed');
	});
});
