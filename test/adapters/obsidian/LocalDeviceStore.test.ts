import { describe, expect, it } from 'vitest';
import { LocalDeviceStore } from '../../../src/adapters/obsidian/LocalDeviceStore';

/** Obsidian 1.8.7+ `App`: vault-scoped local storage that keeps JSON, as the real one does. */
class FakeApp {
	readonly entries = new Map<string, string>();
	readonly calls: string[] = [];

	loadLocalStorage(key: string): unknown {
		this.calls.push(`load ${key}`);
		const json = this.entries.get(key);
		return json === undefined ? null : (JSON.parse(json) as unknown);
	}

	saveLocalStorage(key: string, data: unknown): void {
		this.calls.push(`save ${key}`);
		if (data === null) this.entries.delete(key);
		else this.entries.set(key, JSON.stringify(data));
	}
}

// game-ui S13: the read mark lives on the device, never in a note or data.json.
describe('LocalDeviceStore', () => {
	it('keeps values in Obsidian\'s vault local storage under a dromos: prefix', () => {
		const app = new FakeApp();
		const store = new LocalDeviceStore(app);

		store.write('briefing-read', { date: '2026-11-03', hash: 'abcdef01' });

		expect(app.entries.get('dromos:briefing-read')).toBe('{"date":"2026-11-03","hash":"abcdef01"}');
		expect(new LocalDeviceStore(app).read('briefing-read')).toEqual({ date: '2026-11-03', hash: 'abcdef01' });
		expect(app.calls).toEqual(['save dromos:briefing-read', 'load dromos:briefing-read']);
	});

	it('reads null for a key this device never wrote', () => {
		expect(new LocalDeviceStore(new FakeApp()).read('briefing-read')).toBeNull();
	});

	it('falls back to memory when this Obsidian has no loadLocalStorage (before 1.8.7)', () => {
		const app = { vault: {} };
		const store = new LocalDeviceStore(app);

		expect(store.read('briefing-read')).toBeNull();
		store.write('briefing-read', { date: '2026-11-03', hash: 'abcdef01' });

		expect(store.read('briefing-read')).toEqual({ date: '2026-11-03', hash: 'abcdef01' });
		expect(app).toEqual({ vault: {} });
		expect(new LocalDeviceStore(app).read('briefing-read')).toBeNull();
	});

	it('falls back to memory when only one of the two methods exists, or they are not functions', () => {
		for (const app of [{ loadLocalStorage: () => 'x' }, { loadLocalStorage: 1, saveLocalStorage: 2 }]) {
			const store = new LocalDeviceStore(app);
			store.write('k', 1);

			expect(store.read('k')).toBe(1);
		}
	});

	it('keeps working from memory when the storage throws', () => {
		const app = {
			loadLocalStorage: (): unknown => {
				throw new Error('denied');
			},
			saveLocalStorage: (): void => {
				throw new Error('quota');
			},
		};
		const store = new LocalDeviceStore(app);

		expect(() => store.write('briefing-read', { date: null, hash: 'abcdef01' })).not.toThrow();
		expect(store.read('briefing-read')).toEqual({ date: null, hash: 'abcdef01' });
	});

	it('stores only what JSON keeps, in memory as on disk', () => {
		const store = new LocalDeviceStore({});
		const value = { date: '2026-11-03', when: new Date('2026-11-03T10:00:00Z'), skip: undefined };

		store.write('k', value);

		expect(store.read('k')).toEqual({ date: '2026-11-03', when: '2026-11-03T10:00:00.000Z' });
		expect(store.read('k')).not.toBe(value);
	});
});
