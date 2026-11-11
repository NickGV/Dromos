import { describe, expect, it } from 'vitest';
import { HabiticaClient } from '../../../src/adapters/habitica/HabiticaClient';
import { HabiticaTagCatalog } from '../../../src/adapters/habitica/HabiticaTagCatalog';
import { FakeHttp, respond, type FakeOutcome } from './FakeHttp';

const TOKEN = 'secret-token-0000-4000-8000-123456789abc';
const URL = 'https://habitica.com/api/v3/tags';

function setup(existing: FakeOutcome, created: FakeOutcome = respond(201, { success: true, data: { id: 'new-tag', name: 'skill/x' } })) {
	const http = new FakeHttp().on(URL, existing).onPost(URL, created);
	const client = new HabiticaClient(http.send, () => ({ userId: 'user-1', apiToken: TOKEN }));
	return { http, catalog: new HabiticaTagCatalog(client), creations: () => http.requests.filter((request) => request.method === 'POST').length };
}

const tags = (...items: [string, string][]): FakeOutcome => respond(200, { success: true, data: items.map(([id, name]) => ({ id, name })) });

describe('HabiticaTagCatalog.ensureSkillTags', () => {
	it('returns the ids of the skill tags that exist and creates nothing', async () => {
		const { catalog, http, creations } = setup(tags(['t-lector', 'skill/lector'], ['t-other', 'Work'], ['t-atleta', 'skill/atleta']));

		expect(await catalog.ensureSkillTags(['atleta', 'lector'])).toEqual(['t-atleta', 't-lector']);
		expect(creations()).toBe(0);
		expect(http.requests).toHaveLength(1);
	});

	it('creates the tag named skill/<id> when it is missing and returns the new id, in order', async () => {
		const { catalog, http } = setup(tags(['t-lector', 'skill/lector']), respond(201, { success: true, data: { id: 'new-atleta', name: 'skill/atleta' } }));

		expect(await catalog.ensureSkillTags(['atleta', 'lector'])).toEqual(['new-atleta', 't-lector']);
		const post = http.requests.find((request) => request.method === 'POST');
		expect(JSON.parse(post?.body ?? '{}')).toEqual({ name: 'skill/atleta' });
	});

	it('matches an existing tag without caring for case or spaces', async () => {
		const { catalog, creations } = setup(tags(['t-lector', ' Skill/Lector ']));

		expect(await catalog.ensureSkillTags(['lector'])).toEqual(['t-lector']);
		expect(creations()).toBe(0);
	});

	it('asks for each skill once and makes no request for none', async () => {
		const none = setup(tags());
		expect(await none.catalog.ensureSkillTags([])).toEqual([]);
		expect(none.http.requests).toHaveLength(0);

		const twice = setup(tags(['t-lector', 'skill/lector']));
		expect(await twice.catalog.ensureSkillTags(['lector', 'lector'])).toEqual(['t-lector']);
	});

	it('rejects with the typed errors and never echoes the token', async () => {
		await expect(setup(respond(401, {})).catalog.ensureSkillTags(['lector'])).rejects.toMatchObject({ kind: 'Unauthorized' });
		await expect(setup(respond(429, {}, { 'retry-after': '9' })).catalog.ensureSkillTags(['lector'])).rejects.toMatchObject({ kind: 'RateLimited', retryAfterSeconds: 9 });

		const failed = setup(tags(), new Error(`boom ${TOKEN}`));
		const error: unknown = await failed.catalog.ensureSkillTags(['lector']).then(
			() => null,
			(reason: unknown) => reason,
		);
		expect(String((error as Error).message)).not.toContain(TOKEN);
	});

	it('rejects as Unknown when Habitica answers with something that is not a tag', async () => {
		await expect(setup(tags(), respond(201, { success: true, data: { nope: 1 } })).catalog.ensureSkillTags(['lector'])).rejects.toMatchObject({ kind: 'Unknown' });
		await expect(setup(respond(200, { success: true, data: 'x' })).catalog.ensureSkillTags(['lector'])).rejects.toMatchObject({ kind: 'Unknown' });
	});
});

describe('HabiticaTagCatalog.listTags (M10 S1, L13)', () => {
	it('lists every tag with its id and its name as written, with one GET of /tags', async () => {
		const { catalog, http } = setup(tags(['t-kairos', ' Kairos '], ['t-lector', 'skill/lector']));

		expect(await catalog.listTags()).toEqual([
			{ id: 't-kairos', name: ' Kairos ' },
			{ id: 't-lector', name: 'skill/lector' },
		]);
		expect(http.requests.map((request) => `${request.method} ${request.url}`)).toEqual([`GET ${URL}`]);
	});

	it('fails with the typed error, as the skill tags do', async () => {
		const { catalog } = setup(respond(429, {}, { 'Retry-After': '5' }));

		await expect(catalog.listTags()).rejects.toMatchObject({ kind: 'RateLimited' });
	});
});
