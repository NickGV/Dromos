import { describe, expect, it } from 'vitest';
import { LinkHabitToArea } from '../../src/application/LinkHabitToArea';
import type { CampaignHabit } from '../../src/domain';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { area, habit } from '../domain/campaign/campaignFixtures';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { FakeTaskCreator } from '../fakes/FakeTaskCreator';
import { InMemoryAreaRepository } from '../fakes/InMemoryAreaRepository';

const PATH = '03 - Areas/Bibliotheke/Archeion - Bibliotheke.md';
const noteLink = (path: string): string => `link:${path}`;
const DAILY_ID = '3f2a1c8e-0000-4000-8000-000000000101';

function setup(habits: CampaignHabit[] = [habit('Leer 10 minutos'), habit('Releer notas')], overrides = {}) {
	const repository = new InMemoryAreaRepository([area({ path: PATH, title: 'Archeion - Bibliotheke', habits, ...overrides })]);
	const creator = new FakeTaskCreator();
	const tags = new FakeTagCatalog();
	return { repository, creator, tags, link: new LinkHabitToArea({ repository, creator, noteLink, tags }) };
}

const habiticaIds = async (repository: InMemoryAreaRepository): Promise<(string | null)[]> =>
	(await repository.listAreas())[0]?.habits.map((item) => item.habiticaId) ?? [];

describe('LinkHabitToArea (ADR-017)', () => {
	it('creates the daily in Habitica, tagged with the area skills, and writes its id back into the habit', async () => {
		const { repository, creator, tags, link } = setup();

		const outcome = await link.execute(PATH, 'Leer 10 minutos');

		expect(outcome).toEqual({ kind: 'linked', habiticaId: DAILY_ID });
		expect(tags.asked).toEqual([['lector']]);
		expect(creator.createdDailies).toEqual([{ title: 'Leer 10 minutos', notes: `Dromos · Archeion - Bibliotheke\nlink:${PATH}`, tags: ['tag-lector'] }]);
		expect(creator.created).toEqual([]);
		expect(await habiticaIds(repository)).toEqual([DAILY_ID, null]);
	});

	it('puts the habit skills on the daily when it has its own, else the area ones, and none when neither has', async () => {
		const own = setup([habit('Leer 10 minutos', { skills: ['escritor'] })]);
		await own.link.execute(PATH, 'Leer 10 minutos');
		expect(own.creator.createdDailies[0]?.tags).toEqual(['tag-escritor']);

		const bible = setup([habit('Leer la Biblia', { skills: ['lector'] })], { title: 'Archeion - Bible', skills: ['teologo'] });
		await bible.link.execute(PATH, 'Leer la Biblia');
		expect(bible.creator.createdDailies[0]).toEqual({ title: 'Leer la Biblia', notes: `Dromos · Archeion - Bible\nlink:${PATH}`, tags: ['tag-lector'] });

		const none = setup([habit('Leer 10 minutos')], { skills: [] });
		await none.link.execute(PATH, 'Leer 10 minutos');
		expect(none.tags.asked).toEqual([]);
		expect(none.creator.createdDailies[0]?.tags).toBeUndefined();
	});

	it('creates the daily only once: repeating the click finds it linked', async () => {
		const { creator, link } = setup();

		await link.execute(PATH, 'Leer 10 minutos');

		expect(await link.execute(PATH, 'Leer 10 minutos')).toEqual({ kind: 'already-linked' });
		expect(creator.createdDailies).toHaveLength(1);
	});

	it('shares one creation between two clicks that arrive together', async () => {
		const { creator, link } = setup();

		const [first, second] = await Promise.all([link.execute(PATH, 'Leer 10 minutos'), link.execute(PATH, 'Leer 10 minutos')]);

		expect(creator.createdDailies).toHaveLength(1);
		expect(first).toEqual(second);
	});

	it('answers not-found for an unknown area or habit, and creates nothing', async () => {
		const { creator, link } = setup();

		expect(await link.execute('other.md', 'Leer 10 minutos')).toEqual({ kind: 'not-found' });
		expect(await link.execute(PATH, 'Nope')).toEqual({ kind: 'not-found' });
		expect(creator.createdDailies).toEqual([]);
	});

	it('creates nothing when the tags cannot be ensured', async () => {
		const { creator, tags, link } = setup();
		tags.failWith = new TaskSourceError('Offline', null, 'down');

		expect(await link.execute(PATH, 'Leer 10 minutos')).toEqual({ kind: 'habitica-failed', error: 'Offline' });
		expect(creator.createdDailies).toEqual([]);
	});

	it('reports a Habitica failure with its kind and leaves the habit unsent', async () => {
		const { repository, creator, link } = setup();
		creator.failWith = new TaskSourceError('Unauthorized', 401, 'no');

		expect(await link.execute(PATH, 'Leer 10 minutos')).toEqual({ kind: 'habitica-failed', error: 'Unauthorized' });
		expect(await habiticaIds(repository)).toEqual([null, null]);
	});

	it('says write-failed when the daily exists but its id could not be written, and duplicate when it was linked meanwhile', async () => {
		const failing = setup();
		failing.repository.linkHabitHabiticaId = () => Promise.reject(new Error('disk'));
		expect(await failing.link.execute(PATH, 'Leer 10 minutos')).toEqual({ kind: 'write-failed', habiticaId: DAILY_ID });

		const raced = setup();
		raced.repository.linkHabitHabiticaId = () => Promise.resolve('already-linked');
		expect(await raced.link.execute(PATH, 'Leer 10 minutos')).toEqual({ kind: 'duplicate', habiticaId: DAILY_ID });
	});
});
