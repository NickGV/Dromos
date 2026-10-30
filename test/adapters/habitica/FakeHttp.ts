import { vi } from 'vitest';
import type { HttpFunction, HttpRequest, HttpResponse } from '../../../src/adapters/habitica/http';

/** Scripted outcome for one URL: a response, or an error to reject with (network failure). */
export type FakeOutcome = HttpResponse | Error;

/** Test double for `HttpFunction`: records every request and replays scripted outcomes by URL. */
export class FakeHttp {
	readonly requests: HttpRequest[] = [];
	private readonly outcomes = new Map<string, FakeOutcome>();

	/** Scripts the outcome for an exact URL. Unscripted URLs answer 404. */
	on(url: string, outcome: FakeOutcome): this {
		this.outcomes.set(url, outcome);
		return this;
	}

	readonly send: HttpFunction = (request) => {
		this.requests.push(request);
		const outcome = this.outcomes.get(request.url) ?? respond(404, { success: false, error: 'NotFound' });
		return outcome instanceof Error ? Promise.reject(outcome) : Promise.resolve(outcome);
	};
}

/** A response with the given status, JSON body and headers. */
export function respond(status: number, json: unknown, headers: Record<string, string> = {}): HttpResponse {
	return { status, json, headers };
}

// Literal paths: tsconfig has no resolveJsonModule, so JSON is loaded through Vitest instead of `import`.
const FIXTURE_PATHS = {
	dailys: '../../fixtures/habitica/dailys.json',
	todos: '../../fixtures/habitica/todos.json',
} as const;

/** Loads an anonymized Habitica API v3 response from `test/fixtures/habitica`. */
export async function habiticaFixture(name: keyof typeof FIXTURE_PATHS): Promise<unknown> {
	const module = await vi.importActual<{ default: unknown }>(FIXTURE_PATHS[name]);
	return module.default;
}
