import { vi } from 'vitest';
import type { HttpFunction, HttpMethod, HttpRequest, HttpResponse } from '../../../src/adapters/habitica/http';

/** Scripted outcome for one URL: a response, or an error to reject with (network failure). */
export type FakeOutcome = HttpResponse | Error;

/** Test double for `HttpFunction`: records every request and replays scripted outcomes by URL. */
export class FakeHttp {
	readonly requests: HttpRequest[] = [];
	private readonly outcomes = new Map<string, FakeOutcome>();
	/** Outcomes scripted for one method, keyed by `<method> <url>`; they win over `on`. */
	private readonly methodOutcomes = new Map<string, FakeOutcome>();

	/** Scripts the outcome for an exact URL. Unscripted URLs answer 404. */
	on(url: string, outcome: FakeOutcome): this {
		this.outcomes.set(url, outcome);
		return this;
	}

	/** Scripts the outcome of a `POST` to an exact URL, which wins over `on` for that method. */
	onPost(url: string, outcome: FakeOutcome): this {
		return this.onMethod('POST', url, outcome);
	}

	/** Scripts the outcome of one method on an exact URL, which wins over `on` for that method. */
	onMethod(method: HttpMethod, url: string, outcome: FakeOutcome): this {
		this.methodOutcomes.set(`${method} ${url}`, outcome);
		return this;
	}

	/** The requests sent, as `<method> <url>`, in order. */
	sent(): string[] {
		return this.requests.map((request) => `${request.method} ${request.url}`);
	}

	readonly send: HttpFunction = (request) => {
		this.requests.push(request);
		const scripted = this.methodOutcomes.get(`${request.method} ${request.url}`);
		const outcome = scripted ?? this.outcomes.get(request.url) ?? respond(404, { success: false, error: 'NotFound' });
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
	// Recorded from a real account by `npm run fixtures:habitica`, every id and text replaced (issue #8).
	recordedDailys: '../../fixtures/habitica/recorded/dailys.json',
	recordedTodos: '../../fixtures/habitica/recorded/todos.json',
	recordedCompletedTodos: '../../fixtures/habitica/recorded/completedTodos.json',
} as const;

/** Loads an anonymized Habitica API v3 response from `test/fixtures/habitica`. */
export async function habiticaFixture(name: keyof typeof FIXTURE_PATHS): Promise<unknown> {
	const module = await vi.importActual<{ default: unknown }>(FIXTURE_PATHS[name]);
	return module.default;
}
