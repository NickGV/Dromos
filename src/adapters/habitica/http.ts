/** HTTP verbs the Habitica adapter sends. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

/** One outgoing HTTP request. */
export interface HttpRequest {
	readonly url: string;
	readonly method: HttpMethod;
	readonly headers: Readonly<Record<string, string>>;
	readonly body?: string;
}

/** An HTTP response of any status. */
export interface HttpResponse {
	readonly status: number;
	/** Parsed JSON body, or `null` when the body is not JSON. */
	readonly json: unknown;
	readonly headers: Readonly<Record<string, string>>;
}

/**
 * Sends a request. Resolves for every status, errors included; rejects only when
 * the network fails. Injected so tests never import 'obsidian' (S4).
 */
export type HttpFunction = (request: HttpRequest) => Promise<HttpResponse>;
