import { describe, expect, it } from 'vitest';
import { LinkHabitToCampaign } from '../../src/application/LinkHabitToCampaign';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { campaign, habit } from '../domain/campaign/campaignFixtures';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { FakeTaskCreator } from '../fakes/FakeTaskCreator';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const PATH = '02 - Projects/Salto/README.md';
const noteLink = (path: string): string => `link:${path}`;
const DAILY_ID = '3f2a1c8e-0000-4000-8000-000000000101';

function setup(habits = [habit('Stretch'), habit('Sleep')], overrides = {}) {
	const repository = new InMemoryCampaignRepository([campaign({ path: PATH, title: 'Salto', habits, ...overrides })]);
	const creator = new FakeTaskCreator();
	const tags = new FakeTagCatalog();
	return { repository, creator, tags, link: new LinkHabitToCampaign({ repository, creator, noteLink, tags }) };
}

const habiticaIds = async (repository: InMemoryCampaignRepository): Promise<(string | null)[]> =>
	(await repository.listActive())[0]?.habits.map((item) => item.habiticaId) ?? [];

describe('LinkHabitToCampaign', () => {
	it('creates the daily in Habitica and writes its id back into the habit', async () => {
		const { repository, creator, link } = setup();

		const outcome = await link.execute(PATH, 'Stretch');

		expect(outcome).toEqual({ kind: 'linked', habiticaId: DAILY_ID });
		expect(creator.createdDailies).toEqual([{ title: 'Stretch', notes: `Dromos · Salto\nlink:${PATH}` }]);
		expect(creator.created).toEqual([]);
		expect(await habiticaIds(repository)).toEqual([DAILY_ID, null]);
	});

	it('creates the daily only once: repeating the click does not duplicate it', async () => {
		const { creator, link } = setup();

		await link.execute(PATH, 'Stretch');

		expect(await link.execute(PATH, 'Stretch')).toEqual({ kind: 'already-linked' });
		expect(creator.createdDailies).toHaveLength(1);
	});

	it('shares one creation between two clicks that arrive together', async () => {
		const { creator, link } = setup();

		const [first, second] = await Promise.all([link.execute(PATH, 'Stretch'), link.execute(PATH, 'Stretch')]);

		expect(creator.createdDailies).toHaveLength(1);
		expect(first).toEqual(second);
	});

	it('answers not-found for an unknown campaign or habit and refuses research', async () => {
		const { creator, link } = setup();

		expect(await link.execute('other.md', 'Stretch')).toEqual({ kind: 'not-found' });
		expect(await link.execute(PATH, 'Nope')).toEqual({ kind: 'not-found' });
		expect((await setup([habit('Read')], { kind: 'research' }).link.execute(PATH, 'Read')).kind).toBe('not-a-project');
		expect(creator.createdDailies).toEqual([]);
	});

	it('puts the skill tags on the daily: the habit skills, else the campaign ones', async () => {
		const own = setup([habit('Stretch', { skills: ['cuidador'] })], { skills: ['atleta'] });
		await own.link.execute(PATH, 'Stretch');
		expect(own.creator.createdDailies[0]?.tags).toEqual(['tag-cuidador']);

		const inherited = setup([habit('Stretch')], { skills: ['atleta', 'cuidador'] });
		await inherited.link.execute(PATH, 'Stretch');
		expect(inherited.creator.createdDailies[0]?.tags).toEqual(['tag-atleta', 'tag-cuidador']);

		const none = setup();
		await none.link.execute(PATH, 'Stretch');
		expect(none.tags.asked).toEqual([]);
		expect(none.creator.createdDailies[0]?.tags).toBeUndefined();
	});

	it('creates nothing when the tags cannot be ensured', async () => {
		const { creator, tags, link } = setup([habit('Stretch')], { skills: ['atleta'] });
		tags.failWith = new TaskSourceError('Offline', null, 'down');

		expect(await link.execute(PATH, 'Stretch')).toEqual({ kind: 'habitica-failed', error: 'Offline' });
		expect(creator.createdDailies).toEqual([]);
	});

	it('reports a Habitica failure with its kind and leaves the habit unsent', async () => {
		const { repository, creator, link } = setup();
		creator.failWith = new TaskSourceError('RateLimited', 9, 'slow down');

		expect(await link.execute(PATH, 'Stretch')).toEqual({ kind: 'habitica-failed', error: 'RateLimited' });
		expect(await habiticaIds(repository)).toEqual([null, null]);
	});

	it('says write-failed when the daily exists but its id could not be written', async () => {
		const { repository, link } = setup();
		repository.linkHabitHabiticaId = () => Promise.reject(new Error('disk'));

		expect(await link.execute(PATH, 'Stretch')).toEqual({ kind: 'write-failed', habiticaId: DAILY_ID });
	});

	it('says duplicate when the habit was linked meanwhile', async () => {
		const { repository, link } = setup();
		repository.linkHabitHabiticaId = () => Promise.resolve('already-linked');

		expect(await link.execute(PATH, 'Stretch')).toEqual({ kind: 'duplicate', habiticaId: DAILY_ID });
	});
});
