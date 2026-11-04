import type { DeviceStore } from '../../src/ports';

/** The device's own small state, held in memory; every write is recorded in order. */
export class InMemoryDeviceStore implements DeviceStore {
	readonly writes: (readonly [string, unknown])[] = [];
	private readonly values = new Map<string, unknown>();

	constructor(initial: Readonly<Record<string, unknown>> = {}) {
		for (const [key, value] of Object.entries(initial)) this.values.set(key, value);
	}

	read(key: string): unknown {
		return this.values.get(key) ?? null;
	}

	write(key: string, value: unknown): void {
		this.writes.push([key, value]);
		this.values.set(key, value);
	}
}
