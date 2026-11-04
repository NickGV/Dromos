import { describe, expect, it, vi } from 'vitest';
import { HABITICA_X_CLIENT } from '../../../src/adapters/habitica/HabiticaClient';

describe('scripts/record-habitica-fixtures.mjs (issue #8)', () => {
	it('identifies itself to Habitica with the same x-client as the plugin', async () => {
		// The script runs under plain Node, which cannot load the plugin's modules, so it repeats the value.
		// `?raw` makes Vitest hand over the file's text instead of running it.
		const { default: script } = await vi.importActual<{ default: string }>('../../../scripts/record-habitica-fixtures.mjs?raw');

		expect(script).toContain(`const X_CLIENT = '${HABITICA_X_CLIENT}';`);
	});
});
