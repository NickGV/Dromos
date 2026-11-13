import { describe, expect, it } from 'vitest';
import { LinkHabitToCampaign } from '../../src/application/LinkHabitToCampaign';
import { TaskSourceError } from '../../src/ports/TaskSourceError';
import { WEEKDAYS } from '../../src/domain';
import { campaign, habit } from '../domain/campaign/campaignFixtures';
import { FakeTagCatalog } from '../fakes/FakeTagCatalog';
import { FakeTaskCreator } from '../fakes/FakeTaskCreator';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const PATH = '02 - Projects/Salto/README.md';
const noteLink = (path: string): string => `link:${path}`;
const DAILY_ID = '3f2a1c8e-0000-4000-8000-000000000101';

function setup(habits = [habit('Stretch'), habit('Sleep')], overrides = {}, deletedIds: readonly string[] = []) {
	const repository = new InMemoryCampaignRepository([campaign({ path: PATH, title: 'Salto', habits, ...overrides })]);
	const creator = new FakeTaskCreator();
	const tags = new FakeTagCatalog();
	const deleted = (habiticaId: string): boolean => deletedIds.includes(habiticaId);
	return { repository, creator, tags, link: new LinkHabitToCampaign({ repository, creator, noteLink, tags, deleted }) };
}

const habiticaIds = async (repository: InMemoryCampaignRepository): Promise<(string | null)[]> =>
	(await repository.listActive())[0]?.habits.map((item) => item.habiticaId) ?? [];

describe('LinkHabitToCampaign', () => {
	it('creates the daily in Habitica and writes its id back into the habit', async () => {
		const { repository, creator, link } = setup();

		const outcome = await link.execute(PATH, 'Stretch');

		expect(outcome).toEqual({ kind: 'linked', habiticaId: DAILY_ID });
		// A note of today (`days: 21`, no `repeat` nor `checklist`) sends what it sent before, plus every day spelled out (ADR-021).
		expect(creator.createdDailies).toEqual([{ title: 'Stretch', notes: `Dromos · Salto\nlink:${PATH}`, repeat: WEEKDAYS }]);
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

	it('sends the daily with its repeat days and its checklist (ADR-021)', async () => {
		const { creator, link } = setup([habit('Fuerza para la espalda', { repeat: ['mon', 'wed', 'fri'], checklist: ['Plancha', 'Puente'] })]);

		await link.execute(PATH, 'Fuerza para la espalda');

		expect(creator.createdDailies).toEqual([
			{ title: 'Fuerza para la espalda', notes: `Dromos · Salto\nlink:${PATH}`, repeat: ['mon', 'wed', 'fri'], checklist: ['Plancha', 'Puente'] },
		]);
	});

	it('sends a routine with no streak target like any daily: its target never reaches Habitica', async () => {
		const { creator, link } = setup([habit('Rutina de noche', { days: null })]);

		expect(await link.execute(PATH, 'Rutina de noche')).toEqual({ kind: 'linked', habiticaId: DAILY_ID });
		expect(creator.createdDailies).toEqual([{ title: 'Rutina de noche', notes: `Dromos · Salto\nlink:${PATH}`, repeat: WEEKDAYS }]);
	});
});

describe('LinkHabitToCampaign.resend: "Enviar de nuevo" (ADR-021)', () => {
	const OLD = '3f2a1c8e-0000-4000-8000-0000000000aa';
	const caminar = () => [habit('Caminar', { habiticaId: OLD, repeat: ['mon', 'tue', 'wed', 'thu', 'fri'], checklist: ['Zapatillas'], skills: ['atleta'] }), habit('Dormir')];

	it('creates the daily Habitica confirmed deleted again, with its days and checklist, and replaces its id', async () => {
		const { repository, creator, link } = setup(caminar(), {}, [OLD]);

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'linked', habiticaId: DAILY_ID });
		expect(creator.createdDailies).toEqual([
			{ title: 'Caminar', notes: `Dromos · Salto\nlink:${PATH}`, tags: ['tag-atleta'], repeat: ['mon', 'tue', 'wed', 'thu', 'fri'], checklist: ['Zapatillas'] },
		]);
		expect(await habiticaIds(repository)).toEqual([DAILY_ID, null]);
	});

	it('refuses, and creates nothing, for a habit whose id Habitica did not confirm deleted', async () => {
		const { repository, creator, link } = setup(caminar(), {}, []);

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'changed', habiticaId: null });
		expect(creator.createdDailies).toEqual([]);
		expect(await habiticaIds(repository)).toEqual([OLD, null]);
	});

	it('refuses, and creates nothing, when the note no longer holds the deleted id', async () => {
		const { repository, creator, link } = setup([habit('Caminar', { habiticaId: 'new-by-hand' })], {}, [OLD]);

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'changed', habiticaId: null });
		expect(creator.createdDailies).toEqual([]);
		expect(await habiticaIds(repository)).toEqual(['new-by-hand']);
	});

	it('changes nothing in the note when Habitica fails to create it again', async () => {
		const { repository, creator, link } = setup(caminar(), {}, [OLD]);
		creator.failWith = new TaskSourceError('RateLimited', 30, 'slow down');

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'habitica-failed', error: 'RateLimited' });
		expect(await habiticaIds(repository)).toEqual([OLD, null]);
	});

	it('says the note changed, with the new id, when it changed while the daily was being created', async () => {
		const { repository, link } = setup(caminar(), {}, [OLD]);
		repository.relinkHabitHabiticaId = () => Promise.resolve('changed');

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'changed', habiticaId: DAILY_ID });
	});

	it('says write-failed with the new id when the note could not be saved', async () => {
		const { repository, link } = setup(caminar(), {}, [OLD]);
		repository.relinkHabitHabiticaId = () => Promise.reject(new Error('disk'));

		expect(await link.resend(PATH, 'Caminar')).toEqual({ kind: 'write-failed', habiticaId: DAILY_ID });
	});

	it('shares one creation between two clicks that arrive together', async () => {
		const { creator, link } = setup(caminar(), {}, [OLD]);

		const [first, second] = await Promise.all([link.resend(PATH, 'Caminar'), link.resend(PATH, 'Caminar')]);

		expect(creator.createdDailies).toHaveLength(1);
		expect(first).toEqual(second);
	});

	it('answers not-found for an unknown campaign or habit, and refuses research', async () => {
		const { link } = setup(caminar(), {}, [OLD]);

		expect(await link.resend('other.md', 'Caminar')).toEqual({ kind: 'not-found' });
		expect(await link.resend(PATH, 'Nope')).toEqual({ kind: 'not-found' });
		expect((await setup(caminar(), { kind: 'research' }, [OLD]).link.resend(PATH, 'Caminar')).kind).toBe('not-a-project');
	});

	it('a first send still never creates again a habit that has an id, deleted or not', async () => {
		const { creator, link } = setup(caminar(), {}, [OLD]);

		expect(await link.execute(PATH, 'Caminar')).toEqual({ kind: 'already-linked' });
		expect(creator.createdDailies).toEqual([]);
	});
});
