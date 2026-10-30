import { requestUrl } from 'obsidian';
import type { HttpFunction } from './http';

/**
 * The real `HttpFunction`: Obsidian's `requestUrl` with `throw: false`, so error
 * statuses resolve and only network failures reject. The only file of this
 * adapter that imports 'obsidian'; tests never load it.
 */
export function createObsidianHttp(): HttpFunction {
	return async (request) => {
		const response = await requestUrl({
			url: request.url,
			method: request.method,
			headers: { ...request.headers },
			body: request.body,
			throw: false,
		});
		return { status: response.status, headers: response.headers, json: parseJson(response.text) };
	};
}

// `requestUrl`'s own `json` getter throws on a non-JSON body; read the text and fall back to null.
function parseJson(text: string): unknown {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		return null;
	}
}
