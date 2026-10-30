import { beforeAll, describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaTaskSource } from '../../../src/adapters/habitica/HabiticaTaskSource';
import type { Quest } from '../../../src/domain/quest/Quest';
import type { Clock } from '../../../src/ports/Clock';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, habiticaFixture, respond, type FakeOutcome } from './FakeHttp';

const USER_ID = '00000000-0000-4000-8000-000000000000';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const DAILIES_URL = 'https://habitica.com/api/v3/tasks/user?type=dailys';
const TODOS_URL = 'https://habitica.com/api/v3/tasks/user?type=todos';

const clock: Clock = { today: () => '2026-10-30', now: () => new Date('2026-10-30T17:00:00.000Z') };

let dailys: unknown;
let todos: unknown;

beforeAll(async () => {
	dailys = await habiticaFixture('dailys');
	todos = await habiticaFixture('todos');
});

function sourceWith(dailiesOutcome: FakeOutcome, todosOutcome: FakeOutcome = respond(200, todos)) {
	const http = new FakeHttp().on(DAILIES_URL, dailiesOutcome).on(TODOS_URL, todosOutcome);
	const client = new HabiticaClient(http.send, () => ({ userId: USER_ID, apiToken: TOKEN }));
	return { source: new HabiticaTaskSource(client, clock), http };
}

async function failureOf(dailiesOutcome: FakeOutcome, todosOutcome?: FakeOutcome): Promise<TaskSourceError> {
	const error: unknown = await sourceWith(dailiesOutcome, todosOutcome).source.fetchToday().then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error;
}

const titles = (quests: readonly Quest[]): string[] => quests.map((quest) => quest.title);

describe('HabiticaTaskSource.fetchToday with real fixtures (S6, S10)', () => {
	it('requests dailies and to-dos with the Habitica headers', async () => {
		const { source, http } = sourceWith(respond(200, dailys));

		await source.fetchToday();

		expect(http.requests.map((request) => [request.method, request.url])).toEqual([
			['GET', DAILIES_URL],
			['GET', TODOS_URL],
		]);
		for (const request of http.requests) {
			expect(request.headers).toEqual({ 'x-api-user': USER_ID, 'x-api-key': TOKEN, 'x-client': `${USER_ID}-dromos` });
		}
	});

	it('dailies vencidas hoy: keeps dailies due today, completed included, and drops the rest', async () => {
		const quests = await sourceWith(respond(200, dailys)).source.fetchToday();
		const dailies = quests.filter((quest) => quest.type === 'daily');

		expect(dailies.map((quest) => [quest.title, quest.completed, quest.dueToday])).toEqual([
			['Stretch for ten minutes', false, true],
			['Read twenty pages', true, true],
		]);
		expect(dailies[1]?.skillTags).toEqual(['7a8b9c0d-0000-4000-8000-0000000000a2', '7a8b9c0d-0000-4000-8000-0000000000a3']);
	});

	it('todos sin fecha: keeps undated to-dos (missing date and date null) after the dated ones', async () => {
		const quests = await sourceWith(respond(200, dailys)).source.fetchToday();
		const undated = quests.filter((quest) => quest.type === 'todo' && quest.dueDate === null);

		expect(titles(undated)).toEqual(['Sort the photo archive', 'Plan a weekend walk']);
		expect(undated.every((quest) => !quest.dueToday)).toBe(true);
	});

	it('returns the domain selection: dailies, overdue and due-today to-dos by date, then undated', async () => {
		const quests = await sourceWith(respond(200, dailys)).source.fetchToday();

		expect(quests.map((quest) => [quest.title, quest.dueDate, quest.dueToday])).toEqual([
			['Stretch for ten minutes', null, true],
			['Read twenty pages', null, true],
			['Renew the library card', '2026-10-28', true],
			['Water the plants', '2026-10-30', true],
			['Send the monthly report', '2026-10-30', true],
			['Sort the photo archive', null, false],
			['Plan a weekend walk', null, false],
		]);
	});

	it('hides future-dated and completed to-dos', async () => {
		const quests = await sourceWith(respond(200, dailys)).source.fetchToday();

		expect(titles(quests)).not.toContain('Book the dentist appointment');
		expect(titles(quests)).not.toContain('Return the borrowed book');
	});
});

describe('HabiticaTaskSource.fetchToday errors (S5, S10)', () => {
	it('respuesta 401: rejects with Unauthorized and stops before the to-dos request', async () => {
		const { source, http } = sourceWith(respond(401, { success: false, error: 'NotAuthorized' }));

		await expect(source.fetchToday()).rejects.toMatchObject({ kind: 'Unauthorized' });
		expect(http.requests).toHaveLength(1);
	});

	it('respuesta 429: rejects with RateLimited and the retry seconds', async () => {
		const error = await failureOf(respond(200, dailys), respond(429, { success: false, error: 'TooManyRequests' }, { 'Retry-After': '30' }));

		expect(error).toBeInstanceOf(TaskSourceError);
		expect([error.kind, error.retryAfterSeconds]).toEqual(['RateLimited', 30]);
	});

	it('rejects with Offline when the network fails', async () => {
		expect((await failureOf(new Error('net::ERR_INTERNET_DISCONNECTED'))).kind).toBe('Offline');
	});

	it('rejects with Unknown on 500 and on success: false', async () => {
		const serverError = await failureOf(respond(500, { success: false, error: 'InternalServerError' }));
		const refused = await failureOf(respond(200, { success: false, error: 'BadRequest' }));

		expect([serverError.kind, refused.kind]).toEqual(['Unknown', 'Unknown']);
	});

	it('rejects with Unknown when the task list is malformed', async () => {
		const notAList = await failureOf(respond(200, { success: true, data: { tasks: [] } }));
		const badTask = await failureOf(respond(200, { success: true, data: [{ id: 'task-1', type: 'daily' }] }));
		const badTags = await failureOf(respond(200, { success: true, data: [{ id: 'task-1', text: 'T', type: 'daily', tags: 'tag' }] }));

		expect([notAList.kind, badTask.kind, badTags.kind]).toEqual(['Unknown', 'Unknown', 'Unknown']);
	});

	it('turns any unexpected exception into Unknown', async () => {
		const http = new FakeHttp();
		const client = new HabiticaClient(http.send, () => {
			throw new Error(`settings unreadable ${TOKEN}`);
		});

		const error: unknown = await new HabiticaTaskSource(client, clock).fetchToday().catch((reason: unknown) => reason);

		expect(error).toBeInstanceOf(TaskSourceError);
		expect((error as TaskSourceError).kind).toBe('Unknown');
		expect(String((error as TaskSourceError).stack)).not.toContain(TOKEN);
	});

	it('never puts the token in an error (S9)', async () => {
		const errors = await Promise.all([
			failureOf(new Error(`x-api-key: ${TOKEN}`)),
			failureOf(respond(401, { success: false, message: TOKEN })),
			failureOf(respond(500, { success: false, message: TOKEN })),
		]);

		for (const error of errors) {
			expect(`${error.message} ${error.stack ?? ''} ${Object.values(error).map(String).join(' ')}`).not.toContain(TOKEN);
		}
	});
});
