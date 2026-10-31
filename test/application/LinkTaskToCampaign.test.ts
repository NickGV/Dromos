import { describe, expect, it } from 'vitest';
import { LinkTaskToCampaign } from '../../src/application/LinkTaskToCampaign';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { campaign, task } from '../domain/campaign/campaignFixtures';
import { FakeTaskCreator } from '../fakes/FakeTaskCreator';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const PATH = '02 - Projects/Kairos/README.md';
const noteLink = (path: string): string => `link:${path}`;

function setup(tasks = [task('Write tests', null), task('Ship', null)], overrides = {}) {
	const repository = new InMemoryCampaignRepository([campaign({ path: PATH, title: 'Kairos', tasks, ...overrides })]);
	const creator = new FakeTaskCreator();
	const link = new LinkTaskToCampaign({ repository, creator, noteLink });
	return { repository, creator, link };
}

const habiticaIds = async (repository: InMemoryCampaignRepository): Promise<(string | null)[]> =>
	(await repository.listActive())[0]?.tasks.map((item) => item.habiticaId) ?? [];

describe('LinkTaskToCampaign', () => {
	it('creates the to-do in Habitica and writes its id back into the task', async () => {
		const { repository, creator, link } = setup();

		const outcome = await link.execute(PATH, 'Write tests');

		expect(outcome).toEqual({ kind: 'linked', habiticaId: '3f2a1c8e-0000-4000-8000-000000000001' });
		expect(creator.created).toEqual([{ title: 'Write tests', notes: `Dromos · Kairos\nlink:${PATH}` }]);
		expect(await habiticaIds(repository)).toEqual(['3f2a1c8e-0000-4000-8000-000000000001', null]);
	});

	it('creates the to-do only once: repeating the click does not duplicate it', async () => {
		const { repository, creator, link } = setup();

		await link.execute(PATH, 'Write tests');
		const second = await link.execute(PATH, 'Write tests');

		expect(second).toEqual({ kind: 'already-linked' });
		expect(creator.created).toHaveLength(1);
		expect(await habiticaIds(repository)).toEqual(['3f2a1c8e-0000-4000-8000-000000000001', null]);
	});

	it('shares one creation between two clicks that arrive together', async () => {
		const { creator, link } = setup();

		const [first, second] = await Promise.all([link.execute(PATH, 'Write tests'), link.execute(PATH, 'Write tests')]);

		expect(creator.created).toHaveLength(1);
		expect(first).toEqual(second);
	});

	it('does not create anything for a task that already has a habiticaId', async () => {
		const { creator, link } = setup([task('Sent', null, { habiticaId: 'existing' })]);

		expect(await link.execute(PATH, 'Sent')).toEqual({ kind: 'already-linked' });
		expect(creator.created).toHaveLength(0);
	});

	it('refuses research: Dromos never writes there', async () => {
		const { creator, link } = setup([task('Session', 's1')], { kind: 'research' });

		expect(await link.execute(PATH, 'Session')).toEqual({ kind: 'not-a-project' });
		expect(creator.created).toHaveLength(0);
	});

	it('answers not-found for an unknown campaign or task, without creating anything', async () => {
		const { creator, link } = setup();

		expect(await link.execute('other/README.md', 'Write tests')).toEqual({ kind: 'not-found' });
		expect(await link.execute(PATH, 'Nope')).toEqual({ kind: 'not-found' });
		expect(creator.created).toHaveLength(0);
	});

	it('reports a Habitica failure with its kind and writes nothing', async () => {
		const { repository, creator, link } = setup();
		creator.failWith = new TaskSourceError('Offline');

		expect(await link.execute(PATH, 'Write tests')).toEqual({ kind: 'habitica-failed', error: 'Offline' });
		expect(await habiticaIds(repository)).toEqual([null, null]);
	});

	it('keeps the created id in the outcome when writing it back fails', async () => {
		const { repository, link } = setup();
		repository.linkHabiticaId = () => Promise.reject(new Error('disk full'));

		expect(await link.execute(PATH, 'Write tests')).toEqual({ kind: 'write-failed', habiticaId: '3f2a1c8e-0000-4000-8000-000000000001' });
	});

	it('can be retried after a failure', async () => {
		const { creator, link } = setup();
		creator.failWith = new TaskSourceError('Offline');
		await link.execute(PATH, 'Write tests');
		creator.failWith = null;

		expect((await link.execute(PATH, 'Write tests')).kind).toBe('linked');
	});
});
