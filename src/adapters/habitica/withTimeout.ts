import type { HttpFunction } from './http';

/** How long a Habitica request may take before Dromos treats it as offline. */
export const HTTP_TIMEOUT_MS = 15_000;

/**
 * Rejects a request that has not settled after `ms`, so a hung connection (a
 * captive portal, wifi without internet) reads as a network failure instead of a
 * sync that never ends. `requestUrl` cannot be aborted, so a late response is
 * ignored.
 */
export function withTimeout(http: HttpFunction, ms: number = HTTP_TIMEOUT_MS): HttpFunction {
	return (request) =>
		new Promise((resolve, reject) => {
			const timer = globalThis.setTimeout(() => reject(new Error('Request timed out')), ms);
			http(request).then(
				(response) => {
					globalThis.clearTimeout(timer);
					resolve(response);
				},
				(reason: unknown) => {
					globalThis.clearTimeout(timer);
					reject(reason instanceof Error ? reason : new Error('Request failed'));
				},
			);
		});
}
