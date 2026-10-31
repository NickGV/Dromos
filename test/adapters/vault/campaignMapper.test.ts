import { describe, expect, it } from 'vitest';
import {
	buildActiveCampaigns,
	campaignFromNote,
	isCampaignNote,
	linkPath,
	linkTarget,
	type VaultNote,
} from '../../../src/adapters/vault/campaignMapper';

function note(path: string, frontmatter: unknown, createdOn = '2026-10-01'): VaultNote {
	return { path, frontmatter, createdOn };
}

const KAIROS = note('02 - Projects/Kairos/README.md', {
	type: 'index',
	status: 'active',
	priority: 'high',
	created: '2026-08-01',
	title: 'Kairos',
	area: '[[Archeion - Programming]]',
	skill: 'desarrollador',
	deadline: '2026-12-15',
	stale_after_days: 7,
	phases: [
		{ id: 'design', name: 'Diseño', status: 'completed' },
		{ id: 'mvp', name: 'MVP', status: 'active' },
	],
	tasks: [
		{ title: 'Pantalla de registro de tiempo', phase: 'mvp', habitica_id: '3f2a1c8e-0000-4000-8000-000000000001', skill: 'diseñador', resources: ['[[Jetpack Compose - Navigation]]'] },
		{ title: 'Integrar oro de Habitica', phase: 'mvp', habitica_id: null },
	],
});

const APOCRIFOS = note('03 - Areas/Bible/Estudio/Libros Apocrifos/Estudio - Libros Apócrifos.md', {
	type: 'research',
	status: 'active',
	priority: 'high',
	created: '2026-09-12',
	area: '[[Archeion - Bible]]',
	skill: '',
	habitica_id: '',
	sessions_planned: 8,
	phases: [
		{ id: 's1', name: 'Panorama general', status: 'completed' },
		{ id: 's2', name: 'Deuterocanónicos', status: 'planning' },
	],
});

function session(name: string, frontmatter: Record<string, unknown>): VaultNote {
	return note(`03 - Areas/Bible/Estudio/Libros Apocrifos/${name}.md`, {
		type: 'study-session',
		status: 'completed',
		created: '2026-09-20',
		research: '[[Estudio - Libros Apócrifos]]',
		session: 1,
		phase: 's1',
		habitica_id: '',
		...frontmatter,
	});
}

describe('linkTarget', () => {
	it('returns the file name of a wikilink, without alias or heading', () => {
		expect(linkTarget('[[Estudio - X]]')).toBe('Estudio - X');
		expect(linkTarget('[[Estudio - X|alias]]')).toBe('Estudio - X');
		expect(linkTarget('[[Estudio - X#Heading]]')).toBe('Estudio - X');
		expect(linkTarget('[[Carpeta/Estudio - X]]')).toBe('Estudio - X');
	});

	it('returns null for empty or wrongly typed values', () => {
		expect(linkTarget('')).toBeNull();
		expect(linkTarget(undefined)).toBeNull();
		expect(linkTarget(42)).toBeNull();
		expect(linkTarget('plain text')).toBeNull();
	});
});

describe('linkPath', () => {
	it('returns the path a wikilink points to, with its folder, without alias or heading', () => {
		expect(linkPath('[[Carpeta/Estudio - X|alias]]')).toBe('Carpeta/Estudio - X');
		expect(linkPath('[[Estudio - X#Heading]]')).toBe('Estudio - X');
		expect(linkPath('[[]]')).toBeNull();
		expect(linkPath(42)).toBeNull();
	});
});

describe('isCampaignNote', () => {
	it('accepts active index and research notes', () => {
		expect(isCampaignNote(KAIROS)).toBe(true);
		expect(isCampaignNote(APOCRIFOS)).toBe(true);
	});

	it('rejects child project notes, study sessions and other types', () => {
		expect(isCampaignNote(note('a.md', { type: 'project', status: 'active' }))).toBe(false);
		expect(isCampaignNote(note('a.md', { type: 'study-session', status: 'active' }))).toBe(false);
		expect(isCampaignNote(note('a.md', { status: 'active' }))).toBe(false);
		expect(isCampaignNote(note('a.md', undefined))).toBe(false);
	});

	it('rejects notes that are not active, including closed research', () => {
		for (const status of ['planning', 'paused', 'completed', 'archived', undefined]) {
			expect(isCampaignNote({ ...APOCRIFOS, frontmatter: { type: 'research', status } })).toBe(false);
			expect(isCampaignNote({ ...KAIROS, frontmatter: { type: 'index', status } })).toBe(false);
		}
	});

	it('rejects the templates', () => {
		expect(isCampaignNote(note('Templates/research.md', { type: 'research', status: 'active' }))).toBe(false);
		expect(isCampaignNote(note('Templates/index.md', { type: 'index', status: 'active' }))).toBe(false);
	});
});

describe('isCampaignNote: location', () => {
	const active = { type: 'index', status: 'active' };
	const activeResearch = { type: 'research', status: 'active' };

	it('accepts an index only as the README of a project folder', () => {
		expect(isCampaignNote(note('02 - Projects/Dromos/README.md', active))).toBe(true);
		expect(isCampaignNote(note('02 - Projects/Dromos/Plan.md', active))).toBe(false);
		expect(isCampaignNote(note('02 - Projects/00-INVESTIGACION-MAPA/00-INDEX-INVESTIGACION.md', active))).toBe(false);
		expect(isCampaignNote(note('02 - Projects/README.md', active))).toBe(false);
		expect(isCampaignNote(note('02 - Projects/Dromos/Docs/README.md', active))).toBe(false);
		expect(isCampaignNote(note('00-MAPA-MAESTRO-APRENDIZAJE.md', active))).toBe(false);
	});

	it('accepts a research only under the Estudio folder of an area', () => {
		expect(isCampaignNote(note('03 - Areas/Bible/Estudio/Historia/Estudio - Historia.md', activeResearch))).toBe(true);
		expect(isCampaignNote(note('03 - Areas/Bible/Notas/Estudio - X.md', activeResearch))).toBe(false);
		expect(isCampaignNote(note('02 - Projects/Dromos/09-Auditoria-Logos.md', activeResearch))).toBe(false);
	});
});

describe('campaignFromNote: projects', () => {
	it('maps every field of an index note', () => {
		const campaign = campaignFromNote(KAIROS);

		expect(campaign).toMatchObject({
			kind: 'project',
			path: '02 - Projects/Kairos/README.md',
			title: 'Kairos',
			status: 'active',
			priority: 'high',
			area: 'Archeion - Programming',
			skill: 'desarrollador',
			deadline: '2026-12-15',
			staleAfterDays: 7,
			created: '2026-08-01',
		});
		expect(campaign.phases).toEqual([
			{ id: 'design', name: 'Diseño', status: 'completed' },
			{ id: 'mvp', name: 'MVP', status: 'active' },
		]);
		expect(campaign.tasks).toEqual([
			{
				title: 'Pantalla de registro de tiempo',
				phase: 'mvp',
				habiticaId: '3f2a1c8e-0000-4000-8000-000000000001',
				skill: 'diseñador',
				resources: ['[[Jetpack Compose - Navigation]]'],
				completed: false,
				completedOn: null,
			},
			{ title: 'Integrar oro de Habitica', phase: 'mvp', habiticaId: null, skill: null, resources: [], completed: false, completedOn: null },
		]);
	});

	it('falls back to defaults when fields are missing, never NaN or a throw', () => {
		const bare = note('02 - Projects/Kairos/README.md', { type: 'index', status: 'active' }, '2026-10-05');

		expect(campaignFromNote(bare)).toEqual({
			kind: 'project',
			path: '02 - Projects/Kairos/README.md',
			title: 'README',
			status: 'active',
			priority: 'low',
			area: null,
			skill: null,
			deadline: null,
			staleAfterDays: null,
			created: '2026-10-05',
			phases: [],
			tasks: [],
		});
	});

	it('uses the file name as title when the frontmatter has none', () => {
		const campaign = campaignFromNote(note('02 - Projects/Dromos/Plan.md', { type: 'index', status: 'active' }));

		expect(campaign.title).toBe('Plan');
	});

	it('ignores wrongly typed values instead of failing', () => {
		const messy = note('02 - Projects/X/README.md', {
			type: 'index',
			status: 'active',
			priority: 'urgent',
			created: 'yesterday',
			deadline: 12,
			stale_after_days: 'soon',
			phases: 'none',
			tasks: [null, 'text', { phase: 'mvp' }, { title: 'ok', phase: 7, habitica_id: 3, resources: 'x' }],
		}, '2026-10-02');

		const campaign = campaignFromNote(messy);

		expect(campaign).toMatchObject({ priority: 'low', created: '2026-10-02', deadline: null, staleAfterDays: null, phases: [] });
		expect(campaign.tasks).toEqual([{ title: 'ok', phase: null, habiticaId: '3', skill: null, resources: [], completed: false, completedOn: null }]);
	});

	it('skips phases without an id, defaults the name to the id and a bad status to planning', () => {
		const campaign = campaignFromNote(
			note('a/README.md', { type: 'index', status: 'active', phases: [{ name: 'no id' }, { id: 'x' }, { id: 'y', name: 'Y', status: 'weird' }] }),
		);

		expect(campaign.phases).toEqual([
			{ id: 'x', name: 'x', status: 'planning' },
			{ id: 'y', name: 'Y', status: 'planning' },
		]);
	});

	it('treats an empty or blank habitica_id as not sent, and trims a real one', () => {
		const ids = (...values: unknown[]) =>
			campaignFromNote(note('a/README.md', { type: 'index', status: 'active', tasks: values.map((habitica_id) => ({ title: 't', habitica_id })) })).tasks.map(
				(task) => task.habiticaId,
			);

		expect(ids('', '   ', null, undefined)).toEqual([null, null, null, null]);
		expect(ids(' h1 ')).toEqual(['h1']);
	});

	it('keeps a habitica_id that is not text as a value the Habitica check will flag', () => {
		const campaign = campaignFromNote(note('a/README.md', { type: 'index', status: 'active', tasks: [{ title: 'a', habitica_id: 7 }, { title: 'b', habitica_id: {} }] }));

		expect(campaign.tasks.map((item) => item.habiticaId)).toEqual(['7', '[invalid]']);
	});

	it('accepts only a positive whole number as stale_after_days', () => {
		const days = (value: unknown) => campaignFromNote(note('a/README.md', { type: 'index', status: 'active', stale_after_days: value })).staleAfterDays;

		expect(days(30)).toBe(30);
		expect(days(0)).toBeNull();
		expect(days(-3)).toBeNull();
		expect(days(2.5)).toBeNull();
	});
});

describe('campaignFromNote: research', () => {
	it('maps phases and turns study sessions into tasks, completed by status', () => {
		const done = session('Sesión 1 - Panorama', { session: 1, phase: 's1', status: 'completed', created: '2026-09-14' });
		const open = session('Sesión 2 - Deuterocanónicos', { session: 2, phase: 's2', status: 'active', created: '2026-09-21', habitica_id: 'c48095e9-0000-4000-8000-000000000002' });

		const campaign = campaignFromNote(APOCRIFOS, [open, done]);

		expect(campaign).toMatchObject({ kind: 'research', title: 'Estudio - Libros Apócrifos', priority: 'high', area: 'Archeion - Bible', skill: null, created: '2026-09-12' });
		expect(campaign.tasks).toEqual([
			{ title: 'Sesión 1 - Panorama', phase: 's1', habiticaId: null, skill: null, resources: [], completed: true, completedOn: '2026-09-14' },
			{ title: 'Sesión 2 - Deuterocanónicos', phase: 's2', habiticaId: 'c48095e9-0000-4000-8000-000000000002', skill: null, resources: [], completed: false, completedOn: null },
		]);
	});

	it('links sessions through the research wikilink, with alias or heading, and ignores other research', () => {
		const aliased = session('Sesión A', { research: '[[Estudio - Libros Apócrifos|Apócrifos]]', session: 1 });
		const headed = session('Sesión B', { research: '[[Estudio - Libros Apócrifos#Plan]]', session: 2 });
		const other = session('Sesión C', { research: '[[Estudio - Historia de la Biblia]]', session: 3 });
		const unlinked = session('Sesión D', { research: '', session: 4 });
		const notASession = note('x/Otra nota.md', { type: 'resource', research: '[[Estudio - Libros Apócrifos]]' });

		const campaign = campaignFromNote(APOCRIFOS, [aliased, headed, other, unlinked, notASession]);

		expect(campaign.tasks.map((task) => task.title)).toEqual(['Sesión A', 'Sesión B']);
	});

	it('tells apart two research notes with the same name when the sessions carry the path their link resolves to', () => {
		const first = note('03 - Areas/Bible/Estudio/A/Estudio - T.md', { type: 'research', status: 'active' });
		const second = note('03 - Areas/Bible/Estudio/B/Estudio - T.md', { type: 'research', status: 'active' });
		const own = (name: string, researchPath: string | null) => ({ ...session(name, { research: '[[Estudio - T]]' }), researchPath });
		const sessions = [own('Sesión A', first.path), own('Sesión B', second.path)];

		expect(campaignFromNote(first, sessions).tasks.map((task) => task.title)).toEqual(['Sesión A']);
		expect(campaignFromNote(second, sessions).tasks.map((task) => task.title)).toEqual(['Sesión B']);
	});

	it('falls back to the file name when the link did not resolve', () => {
		const unresolved = { ...session('Sesión U', { research: '[[Estudio - Libros Apócrifos]]' }), researchPath: null };

		expect(campaignFromNote(APOCRIFOS, [unresolved]).tasks.map((task) => task.title)).toEqual(['Sesión U']);
	});

	it('orders sessions by their number, then by title, and tolerates a missing number', () => {
		const campaign = campaignFromNote(APOCRIFOS, [
			session('Zeta', { session: 2 }),
			session('Alfa', { session: 2 }),
			session('Primera', { session: 1 }),
			session('Sin número', { session: undefined }),
		]);

		expect(campaign.tasks.map((task) => task.title)).toEqual(['Sin número', 'Primera', 'Alfa', 'Zeta']);
	});

	it('does not assume a skill when the research skill is empty', () => {
		expect(campaignFromNote(APOCRIFOS).skill).toBeNull();
	});
});

describe('buildActiveCampaigns', () => {
	it('lists only active campaigns and attaches the sessions of each research', () => {
		const notes = [
			KAIROS,
			APOCRIFOS,
			session('Sesión 1', {}),
			note('02 - Projects/Cheshbon/README.md', { type: 'index', status: 'completed' }),
			note('02 - Projects/Kairos/Tarea.md', { type: 'project', status: 'active', parent: '[[Kairos]]' }),
			note('Templates/research.md', { type: 'research', status: 'active' }),
			note('00-MAPA-MAESTRO-APRENDIZAJE.md', { type: 'index', status: 'active' }),
			note('02 - Projects/00-INVESTIGACION-MAPA/00-INDEX-INVESTIGACION.md', { type: 'index', status: 'active' }),
			note('02 - Projects/Dromos/09-Auditoria-Logos.md', { type: 'research', status: 'active' }),
		];

		const campaigns = buildActiveCampaigns(notes);

		expect(campaigns.map((campaign) => campaign.title)).toEqual(['Estudio - Libros Apócrifos', 'Kairos']);
		expect(campaigns[0]?.tasks).toHaveLength(1);
	});

	it('sorts by priority, high first, then by title', () => {
		const make = (name: string, priority?: string) => note(`02 - Projects/${name}/README.md`, { type: 'index', status: 'active', title: name, priority });

		const titles = buildActiveCampaigns([make('Zeta', 'low'), make('Beta', 'high'), make('Alfa', 'medium'), make('Acme', 'high'), make('Sin prioridad')]).map(
			(campaign) => campaign.title,
		);

		expect(titles).toEqual(['Acme', 'Beta', 'Alfa', 'Sin prioridad', 'Zeta']);
	});

	it('returns an empty list when nothing qualifies', () => {
		expect(buildActiveCampaigns([])).toEqual([]);
	});
});
