import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaGoldAccount } from '../../../src/adapters/habitica/HabiticaGoldAccount';
import { HabiticaRewardCatalog } from '../../../src/adapters/habitica/HabiticaRewardCatalog';
import { TaskSourceError } from '../../../src/ports/TaskSourceError';
import { FakeHttp, respond } from './FakeHttp';

const API = 'https://habitica.com/api/v3';
const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const COFFEE = '3f2a1c8e-0000-4000-8000-000000000001';
const BOOK = '3f2a1c8e-0000-4000-8000-000000000002';

function shop(http: FakeHttp) {
	const client = new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN }));
	return { gold: new HabiticaGoldAccount(client), rewards: new HabiticaRewardCatalog(client) };
}

async function errorOf(promise: Promise<unknown>): Promise<TaskSourceError> {
	const error: unknown = await promise.then(
		() => null,
		(reason: unknown) => reason,
	);
	if (!(error instanceof TaskSourceError)) throw new Error(`expected a TaskSourceError, got ${String(error)}`);
	return error;
}

const reward = (id: string, text: string, value: unknown, extra: Record<string, unknown> = {}) => ({ id, _id: id, type: 'reward', text, notes: '', value, ...extra });

describe('HabiticaGoldAccount.readGold (M10 S1)', () => {
	it("reads the gold from the user's stats, with one GET of only the stats", async () => {
		const http = new FakeHttp().on(`${API}/user?userFields=stats`, respond(200, { success: true, data: { stats: { gp: 124.62, hp: 50 } } }));

		expect(await shop(http).gold.readGold()).toBe(124.62);
		expect(http.sent()).toEqual([`GET ${API}/user?userFields=stats`]);
	});

	it('fails as Unknown when the answer has no gold, without the token in the message', async () => {
		const http = new FakeHttp().on(`${API}/user?userFields=stats`, respond(200, { success: true, data: { stats: {} } }));

		const error = await errorOf(shop(http).gold.readGold());

		expect(error.kind).toBe('Unknown');
		expect(error.message).not.toContain(TOKEN);
	});

	it('passes the typed errors through', async () => {
		const http = new FakeHttp().on(`${API}/user?userFields=stats`, respond(401, {}));

		expect((await errorOf(shop(http).gold.readGold())).kind).toBe('Unauthorized');
	});
});

describe('HabiticaRewardCatalog.list (M10 S1)', () => {
	it('lists the rewards with their name, their notes when they have any, and their price', async () => {
		const http = new FakeHttp().on(`${API}/tasks/user?type=rewards`, respond(200, { success: true, data: [reward(COFFEE, 'Coffee out', 20, { notes: 'At the corner café' }), reward(BOOK, 'A new book', 75)] }));

		expect(await shop(http).rewards.list()).toEqual([
			{ id: COFFEE, name: 'Coffee out', notes: 'At the corner café', price: 20, alias: null, tags: [] },
			{ id: BOOK, name: 'A new book', notes: null, price: 75, alias: null, tags: [] },
		]);
		expect(http.sent()).toEqual([`GET ${API}/tasks/user?type=rewards`]);
	});

	it('keeps the ids of the tags a reward carries (L13)', async () => {
		const http = new FakeHttp().on(`${API}/tasks/user?type=rewards`, respond(200, { success: true, data: [reward(COFFEE, 'Coffee out', 20, { tags: ['t-kairos', 't-food'] })] }));

		expect((await shop(http).rewards.list())[0]?.tags).toEqual(['t-kairos', 't-food']);
	});

	it('keeps the alias of a reward that has one', async () => {
		const http = new FakeHttp().on(`${API}/tasks/user?type=rewards`, respond(200, { success: true, data: [reward(COFFEE, 'Coffee out', 20, { alias: 'coffee' })] }));

		expect((await shop(http).rewards.list())[0]?.alias).toBe('coffee');
	});

	it('leaves out a reward with no usable price instead of making one up', async () => {
		const http = new FakeHttp().on(`${API}/tasks/user?type=rewards`, respond(200, { success: true, data: [reward(COFFEE, 'Coffee out', 'cheap'), reward(BOOK, 'A new book', -5), reward('c', 'Tea', 3)] }));

		expect((await shop(http).rewards.list()).map((entry) => entry.name)).toEqual(['Tea']);
	});

	it('fails as Unknown when the list is not a task list', async () => {
		const http = new FakeHttp().on(`${API}/tasks/user?type=rewards`, respond(200, { success: true, data: { nope: true } }));

		expect((await errorOf(shop(http).rewards.list())).kind).toBe('Unknown');
	});
});

describe('HabiticaRewardCatalog.buy (M10 S1)', () => {
	it('buys the reward by scoring it up, with no body, and resolves with the gold Habitica returns', async () => {
		const url = `${API}/tasks/${COFFEE}/score/up`;
		const http = new FakeHttp().onPost(url, respond(200, { success: true, data: { delta: 0, gp: 104.62, hp: 50 } }));

		expect(await shop(http).rewards.buy(COFFEE)).toBe(104.62);
		expect(http.sent()).toEqual([`POST ${url}`]);
		expect(http.requests[0]?.body).toBeUndefined();
	});

	it('resolves null when Habitica bought it but sent no readable gold', async () => {
		const http = new FakeHttp().onPost(`${API}/tasks/${COFFEE}/score/up`, respond(200, { success: true, data: { delta: 0 } }));

		expect(await shop(http).rewards.buy(COFFEE)).toBeNull();
	});

	it('escapes the id in the path', async () => {
		const http = new FakeHttp();

		await shop(http).rewards.buy('a/b').catch(() => undefined);

		expect(http.sent()).toEqual([`POST ${API}/tasks/a%2Fb/score/up`]);
	});

	it('fails with the typed error Habitica gives, Unauthorized when it refuses the gold', async () => {
		const http = new FakeHttp().onPost(`${API}/tasks/${COFFEE}/score/up`, respond(401, { success: false, error: 'NotAuthorized', message: 'Not enough gold.' }));

		const error = await errorOf(shop(http).rewards.buy(COFFEE));

		expect(error.kind).toBe('Unauthorized');
		expect(error.message).not.toContain(TOKEN);
	});
});

describe('HabiticaGoldAccount.setGold (M10 S3)', () => {
	it("sets the gold with one PUT of stats.gp and resolves with the gold Habitica then holds", async () => {
		const http = new FakeHttp().onMethod('PUT', `${API}/user`, respond(200, { success: true, data: { stats: { gp: 154.62 } } }));

		expect(await shop(http).gold.setGold(154.62)).toBe(154.62);
		expect(http.sent()).toEqual([`PUT ${API}/user`]);
		expect(JSON.parse(http.requests[0]?.body ?? '{}')).toEqual({ 'stats.gp': 154.62 });
	});

	it('resolves null when Habitica set it but sent no readable gold', async () => {
		const http = new FakeHttp().onMethod('PUT', `${API}/user`, respond(200, { success: true, data: {} }));

		expect(await shop(http).gold.setGold(10)).toBeNull();
	});

	it('fails with the typed errors, without the token in the message', async () => {
		const http = new FakeHttp().onMethod('PUT', `${API}/user`, new Error(`socket ${TOKEN}`));

		const error = await errorOf(shop(http).gold.setGold(10));

		expect(error.kind).toBe('Offline');
		expect(error.message).not.toContain(TOKEN);
	});
});

describe('HabiticaRewardCatalog: the reward of an offer (M10 S2)', () => {
	const OFFER = '3f2a1c8e-0000-4000-8000-0000000000aa';

	it('looks a reward up by its alias, with one GET of /tasks/<alias>', async () => {
		const url = `${API}/tasks/dromos-offer-book-week`;
		const http = new FakeHttp().on(url, respond(200, { success: true, data: reward(OFFER, 'A book of the week', 40, { alias: 'dromos-offer-book-week', notes: 'Five days' }) }));

		expect(await shop(http).rewards.findByAlias('dromos-offer-book-week')).toEqual({ id: OFFER, name: 'A book of the week', notes: 'Five days', price: 40, alias: 'dromos-offer-book-week', tags: [] });
		expect(http.sent()).toEqual([`GET ${url}`]);
	});

	it('answers null when Habitica has no task with that alias', async () => {
		expect(await shop(new FakeHttp()).rewards.findByAlias('dromos-offer-walk')).toBeNull();
	});

	it('fails as Unknown when the task found is not a reward', async () => {
		const http = new FakeHttp().on(`${API}/tasks/dromos-offer-walk`, respond(200, { success: true, data: { id: OFFER, type: 'todo', text: 'Walk' } }));

		expect((await errorOf(shop(http).rewards.findByAlias('dromos-offer-walk'))).kind).toBe('Unknown');
	});

	it('creates a reward with its name, notes, price and alias, and answers with it', async () => {
		const http = new FakeHttp().onPost(`${API}/tasks/user`, respond(201, { success: true, data: reward(OFFER, 'A walk', 15, { alias: 'dromos-offer-walk' }) }));

		const created = await shop(http).rewards.create({ name: 'A walk', notes: 'Fresh air', price: 15, alias: 'dromos-offer-walk' });

		expect(created).toEqual({ id: OFFER, name: 'A walk', notes: null, price: 15, alias: 'dromos-offer-walk', tags: [] });
		expect(JSON.parse(http.requests[0]?.body ?? '{}')).toEqual({ type: 'reward', text: 'A walk', notes: 'Fresh air', value: 15, alias: 'dromos-offer-walk' });
	});

	it('deletes a reward with one DELETE of /tasks/<id>', async () => {
		const url = `${API}/tasks/${OFFER}`;
		const http = new FakeHttp().onMethod('DELETE', url, respond(200, { success: true, data: {} }));

		await shop(http).rewards.remove(OFFER);

		expect(http.sent()).toEqual([`DELETE ${url}`]);
	});
});
