import { describe, expect, it } from 'vitest';
import type { OpenTodo } from '../../src/application/CampaignState';
import { LinkExistingTask } from '../../src/application/LinkExistingTask';
import type { Campaign } from '../../src/domain';
import { campaign, task } from '../domain/campaign/campaignFixtures';
import { InMemoryCampaignRepository } from '../fakes/InMemoryCampaignRepository';

const P = '02 - Projects/Cheshbon/README.md';
const H1 = '3f2a1c8e-0000-4000-8000-000000000001';
const H2 = '3f2a1c8e-0000-4000-8000-000000000002';
const H3 = '3f2a1c8e-0000-4000-8000-000000000003';
const H4 = '3f2a1c8e-0000-4000-8000-000000000004';

const cheshbon = (): Campaign => campaign({ path: P, title: 'Cheshbon', tasks: [task('Mejoras', null), task('Informe', null, { habiticaId: H1 })] });
const LIST: OpenTodo[] = [
	{ habiticaId: H1, title: 'Informe' },
	{ habiticaId: H2, title: 'Pagar el arriendo' },
	{ habiticaId: H3, title: 'Mejoras para Cheshbon' },
	{ habiticaId: H4, title: 'Probar Dromos esta semana' },
];

function setup(options: { campaigns?: Campaign[]; completed?: Campaign[]; others?: Campaign[]; openTodos?: readonly OpenTodo[] | null } = {}) {
	const repository = new InMemoryCampaignRepository(options.campaigns ?? [cheshbon()], options.completed ?? [], options.others ?? []);
	const writes: string[] = [];
	const linkHabiticaId = repository.linkHabiticaId.bind(repository);
	repository.linkHabiticaId = (path, title, id) => {
		writes.push(`${path}|${title}|${id}`);
		return linkHabiticaId(path, title, id);
	};
	const openTodos = options.openTodos === undefined ? LIST : options.openTodos;
	return { repository, writes, link: new LinkExistingTask({ repository, openTodos: () => openTodos }) };
}

const taskIds = async (repository: InMemoryCampaignRepository): Promise<(string | null)[]> => (await repository.listActive())[0]?.tasks.map((item) => item.habiticaId) ?? [];

describe('LinkExistingTask.choices (link-existing-todo S3, S4)', () => {
	it('has no choices before the sync listed the open to-dos', async () => {
		expect(await setup({ openTodos: null }).link.choices()).toBeNull();
	});

	it('has no choices, and does not reject, when the notes cannot be read', async () => {
		const { link, repository } = setup();
		repository.linkedTaskIds = () => Promise.reject(new Error('vault down'));

		expect(await link.choices()).toBeNull();
	});

	it('leaves out every to-do already linked to a task of any campaign, and keeps the order', async () => {
		const paused = campaign({ path: '02 - Projects/Salto/README.md', status: 'paused', tasks: [task('a', null, { habiticaId: H4 })] });
		const done = campaign({ path: '02 - Projects/Viejo/README.md', status: 'completed', tasks: [task('a', null, { habiticaId: H2 })] });

		const choices = await setup({ completed: [done], others: [paused] }).link.choices();

		expect(choices).toEqual([{ habiticaId: H3, title: 'Mejoras para Cheshbon' }]);
	});
});

describe('LinkExistingTask.execute (link-existing-todo S2, S4)', () => {
	it('writes the chosen id into the task through the repository, and nothing else', async () => {
		const { link, repository, writes } = setup();

		expect(await link.execute(P, 'Mejoras', H3)).toEqual({ kind: 'linked', habiticaId: H3 });

		expect(await taskIds(repository)).toEqual([H3, H1]);
		expect(writes).toEqual([`${P}|Mejoras|${H3}`]);
	});

	it('answers `taken` and writes nothing when the to-do was linked to another task since the sync', async () => {
		const paused = campaign({ path: '02 - Projects/Salto/README.md', status: 'paused', tasks: [task('a', null, { habiticaId: H3 })] });
		const { link, writes } = setup({ others: [paused] });

		expect(await link.execute(P, 'Mejoras', H3)).toEqual({ kind: 'taken' });
		expect(writes).toEqual([]);
	});

	it('answers `already-linked` and writes nothing when the task already has an id', async () => {
		const { link, writes } = setup();

		expect(await link.execute(P, 'Informe', H3)).toEqual({ kind: 'already-linked' });
		expect(writes).toEqual([]);
	});

	it('answers `already-linked` when the note gained an id between the check and the write', async () => {
		const { link, repository } = setup();
		repository.linkHabiticaId = () => Promise.resolve('already-linked');

		expect(await link.execute(P, 'Mejoras', H3)).toEqual({ kind: 'already-linked' });
	});

	it('answers `not-found` for a campaign or a task that is not there', async () => {
		const { link, writes } = setup();

		expect(await link.execute('02 - Projects/Nada/README.md', 'Mejoras', H3)).toEqual({ kind: 'not-found' });
		expect(await link.execute(P, 'Otra', H3)).toEqual({ kind: 'not-found' });
		expect(writes).toEqual([]);
	});

	it('answers `not-a-project` for a research', async () => {
		const research = campaign({ kind: 'research', path: P, tasks: [task('Mejoras', null)] });

		expect(await setup({ campaigns: [research] }).link.execute(P, 'Mejoras', H3)).toEqual({ kind: 'not-a-project' });
	});

	it('answers `write-failed` when the note cannot be written, and never rejects', async () => {
		const { link, repository } = setup();
		repository.linkHabiticaId = () => Promise.reject(new Error('disk full'));

		expect(await link.execute(P, 'Mejoras', H3)).toEqual({ kind: 'write-failed' });
	});

	it('joins a second pick of the same task while the first is running', async () => {
		const { link, writes } = setup();

		const [first, second] = await Promise.all([link.execute(P, 'Mejoras', H3), link.execute(P, 'Mejoras', H3)]);

		expect(first).toEqual({ kind: 'linked', habiticaId: H3 });
		expect(second).toEqual(first);
		expect(writes).toHaveLength(1);
	});
});
