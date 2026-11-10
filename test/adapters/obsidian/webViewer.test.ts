import type { App } from 'obsidian';
import { describe, expect, it } from 'vitest';
import { linksOpenInObsidian } from '../../../src/adapters/obsidian/webViewer';

/** An app whose core plugins answer `getEnabledPluginById` with `found`. */
const appWith = (found: (id: string) => unknown): App => ({ internalPlugins: { getEnabledPluginById: found } }) as unknown as App;

describe('linksOpenInObsidian: whether the Web viewer takes external links (M8 S9)', () => {
	it('is true when the Web viewer is on and opens external links', () => {
		const asked: string[] = [];
		const app = appWith((id) => {
			asked.push(id);
			return { options: { openExternalURLs: true } };
		});

		expect(linksOpenInObsidian(app)).toBe(true);
		expect(asked).toEqual(['webviewer']);
	});

	it('is false when the Web viewer is on but leaves external links to the browser', () => {
		expect(linksOpenInObsidian(appWith(() => ({ options: { openExternalURLs: false } })))).toBe(false);
	});

	it('is false when the Web viewer is off', () => {
		expect(linksOpenInObsidian(appWith(() => null))).toBe(false);
	});

	it('is false when the app has no such core plugins, as on a phone or after Obsidian changes them', () => {
		expect(linksOpenInObsidian({} as App)).toBe(false);
		expect(linksOpenInObsidian({ internalPlugins: {} } as unknown as App)).toBe(false);
		expect(linksOpenInObsidian(appWith(() => ({})))).toBe(false);
		expect(linksOpenInObsidian(appWith(() => ({ options: { openExternalURLs: 'yes' } })))).toBe(false);
	});

	it('is false when asking throws', () => {
		expect(
			linksOpenInObsidian(
				appWith(() => {
					throw new Error('changed');
				}),
			),
		).toBe(false);
	});
});
