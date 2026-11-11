import { TaskSourceError } from '../../ports';
import type { HttpFunction, HttpMethod, HttpResponse } from './http';

/** Root of Habitica's API v3; request paths are appended to it. */
export const HABITICA_BASE_URL = 'https://habitica.com/api/v3';

/**
 * Value of the `X-Client` header. Habitica's API usage guidelines ask for
 * `<creator's user ID>-<app name>`: the id of the person who made the tool, not of whoever
 * runs it. The id is not a secret; it only tells Habitica whom to contact about this tool.
 */
export const HABITICA_X_CLIENT = '283a330c-db80-446e-abea-d8260ca7978b-dromos';

/** Habitica account credentials, as stored in the plugin settings (S3). */
export interface HabiticaCredentials {
	readonly userId: string;
	readonly apiToken: string;
}

/** Called before every request, so edited settings apply without rebuilding the client. */
export type CredentialsProvider = () => HabiticaCredentials | Promise<HabiticaCredentials>;

/**
 * Habitica API v3 client over an injected `HttpFunction` (S4). Unwraps the
 * `{ success, data }` envelope and turns every HTTP failure into a
 * `TaskSourceError` (S5). Error messages never carry credentials (S9). Credentials a header
 * cannot carry fail as `Unauthorized` before any request is sent (issue #9).
 */
export class HabiticaClient {
	constructor(
		private readonly http: HttpFunction,
		private readonly credentials: CredentialsProvider,
	) {}

	/** `GET` a path such as `/tasks/user?type=dailys` and resolve with the envelope's `data`. */
	async get(path: string): Promise<unknown> {
		return dataOf(await this.request('GET', path));
	}

	/**
	 * `POST` a JSON body and resolve with the envelope's `data` (for example the created task).
	 * Without a body, as scoring a task (`/tasks/:id/score/up`), nothing but the headers is sent.
	 */
	async post(path: string, body?: unknown): Promise<unknown> {
		return dataOf(await this.request('POST', path, body));
	}

	/** `PUT` a JSON body, such as `{ "stats.gp": 40 }` on `/user`, and resolve with the envelope's `data`. */
	async put(path: string, body: unknown): Promise<unknown> {
		return dataOf(await this.request('PUT', path, body));
	}

	/** `DELETE` a path such as `/tasks/<id>` and resolve with the envelope's `data`. */
	async delete(path: string): Promise<unknown> {
		return dataOf(await this.request('DELETE', path));
	}

	/**
	 * Like `get`, but resolves `null` on a 404 so a deleted task is told apart from
	 * a failure. Every other outcome behaves as in `get`.
	 */
	async find(path: string): Promise<unknown> {
		const response = await this.request('GET', path);
		return response.status === 404 ? null : dataOf(response);
	}

	private async request(method: HttpMethod, path: string, body?: unknown): Promise<HttpResponse> {
		const { userId, apiToken } = await this.credentials();
		// A value a header cannot carry makes the HTTP layer throw, which would read as offline.
		if (!isHeaderSafe(userId) || !isHeaderSafe(apiToken)) {
			throw new TaskSourceError('Unauthorized', null, 'Habitica credentials contain characters that cannot be sent');
		}
		try {
			return await this.http({
				url: `${HABITICA_BASE_URL}${path}`,
				method,
				headers: {
					'x-api-user': userId,
					'x-api-key': apiToken,
					'x-client': HABITICA_X_CLIENT,
					...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
				},
				...(body === undefined ? {} : { body: JSON.stringify(body) }),
			});
		} catch {
			// The original error is dropped on purpose: it may echo request details.
			throw new TaskSourceError('Offline', null, 'Habitica could not be reached');
		}
	}
}

// Visible ASCII only, what Habitica's user IDs and API tokens are made of: no space, line break, accent
// or invisible character. An empty value passes; the use cases report it as not configured first.
function isHeaderSafe(value: string): boolean {
	return !/[^\x21-\x7e]/.test(value);
}

// Maps the status and body to the envelope's data or a typed error (S5).
function dataOf(response: HttpResponse): unknown {
	const { status, json } = response;
	if (status === 401) throw new TaskSourceError('Unauthorized', null, 'Habitica rejected the credentials');
	if (status === 429) {
		throw new TaskSourceError('RateLimited', retryAfterSeconds(response.headers), 'Habitica rate limit reached');
	}
	if (status < 200 || status >= 300) throw new TaskSourceError('Unknown', null, `Habitica answered with status ${status}`);
	if (!isSuccessEnvelope(json)) throw new TaskSourceError('Unknown', null, 'Habitica sent an unexpected response');
	return json.data;
}

function isSuccessEnvelope(body: unknown): body is { success: true; data: unknown } {
	return typeof body === 'object' && body !== null && 'success' in body && body.success === true && 'data' in body;
}

// Retry-After in whole seconds; header names are matched case-insensitively. HTTP-date values read as null.
function retryAfterSeconds(headers: Readonly<Record<string, string>>): number | null {
	const value = Object.entries(headers).find(([name]) => name.toLowerCase() === 'retry-after')?.[1]?.trim();
	if (!value) return null;
	const seconds = Number(value);
	return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}
