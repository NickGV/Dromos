import { describe, expect, it } from 'vitest';
import {
	buildActiveCampaigns,
	buildCompletedCampaigns,
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
			skills: ['desarrollador'],
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
				skills: ['diseñador'],
				resources: ['[[Jetpack Compose - Navigation]]'],
				completed: false,
				completedOn: null,
			},
			{ title: 'Integrar oro de Habitica', phase: 'mvp', habiticaId: null, skills: [], resources: [], completed: false, completedOn: null },
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
			skills: [],
			deadline: null,
			staleAfterDays: null,
			created: '2026-10-05',
			phases: [],
			tasks: [],
			habits: [],
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
		expect(campaign.tasks).toEqual([{ title: 'ok', phase: null, habiticaId: '3', skills: [], resources: [], completed: false, completedOn: null }]);
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

		expect(campaign).toMatchObject({ kind: 'research', title: 'Estudio - Libros Apócrifos', priority: 'high', area: 'Archeion - Bible', skills: [], created: '2026-09-12' });
		expect(campaign.tasks).toEqual([
			{ title: 'Sesión 1 - Panorama', phase: 's1', habiticaId: null, skills: [], resources: [], completed: true, completedOn: '2026-09-14' },
			{ title: 'Sesión 2 - Deuterocanónicos', phase: 's2', habiticaId: 'c48095e9-0000-4000-8000-000000000002', skills: [], resources: [], completed: false, completedOn: null },
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
		expect(campaignFromNote(APOCRIFOS).skills).toEqual([]);
	});

	it.each([
		['a single id', 'exegeta', ['exegeta']],
		['a list', ['exegeta', 'estudiante'], ['exegeta', 'estudiante']],
		['a list with blanks, junk and repeats', ['exegeta', '', '  ', 3, null, 'exegeta', ' estudiante '], ['exegeta', 'estudiante']],
		['an empty text', '', []],
		['an empty list', [], []],
		['null', null, []],
		['a number', 7, []],
		['a map', { id: 'exegeta' }, []],
	])('reads the skill of a campaign given as %s', (_label, skill, expected) => {
		const campaign = campaignFromNote(note('a/README.md', { type: 'index', status: 'active', skill, tasks: [{ title: 'T', skill }] }));

		expect(campaign.skills).toEqual(expected);
		expect(campaign.tasks[0]?.skills).toEqual(expected);
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

describe('completed campaigns (they count toward the campaigns requirement of a skill)', () => {
	const CHESHBON = note('02 - Projects/Cheshbon/README.md', { type: 'index', status: 'completed', title: 'Cheshbon', skill: ['desarrollador'], created: '2026-03-01' });
	const HISTORIA = note('03 - Areas/Bible/Estudio/Historia de la Biblia/Estudio - Historia.md', { type: 'research', status: 'completed', skill: 'exegeta' });

	it('isCampaignNote can ask for a status and keeps the path rules', () => {
		expect(isCampaignNote(CHESHBON, 'completed')).toBe(true);
		expect(isCampaignNote(CHESHBON)).toBe(false);
		expect(isCampaignNote(KAIROS, 'completed')).toBe(false);
		expect(isCampaignNote(note('a.md', { type: 'index', status: 'completed' }), 'completed')).toBe(false);
	});

	it('lists the completed projects and researches with their status and skills', () => {
		const campaigns = buildCompletedCampaigns([KAIROS, CHESHBON, HISTORIA]);

		expect(campaigns.map((campaign) => [campaign.title, campaign.status, campaign.skills])).toEqual([
			['Cheshbon', 'completed', ['desarrollador']],
			['Estudio - Historia', 'completed', ['exegeta']],
		]);
	});

	it('the active list never includes them, and an active campaign reads as active', () => {
		expect(buildActiveCampaigns([KAIROS, CHESHBON, HISTORIA]).map((campaign) => [campaign.title, campaign.status])).toEqual([['Kairos', 'active']]);
	});
});

const EVERY_DAY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

describe('campaign habits (S8)', () => {
	const withHabits = (habits: unknown, extra: Record<string, unknown> = {}) =>
		campaignFromNote(note('02 - Projects/Salto/README.md', { type: 'index', status: 'active', skill: 'atleta', habits, ...extra }));

	it('maps a habit with its target days, its skills and its Habitica id', () => {
		const campaign = withHabits([
			{ title: 'Estiramiento diario', days: 30, skill: ['atleta', 'cuidador'], habitica_id: '3f2a1c8e-0000-4000-8000-000000000009' },
		]);

		expect(campaign.habits).toEqual([
			{ title: 'Estiramiento diario', days: 30, repeat: EVERY_DAY, checklist: [], skills: ['atleta', 'cuidador'], habiticaId: '3f2a1c8e-0000-4000-8000-000000000009', streak: null },
		]);
	});

	it('has no streak target when the habit gives none or a bad number (ADR-021), reads digits in a text as a number, and has no skill of its own', () => {
		const campaign = withHabits([{ title: 'A' }, { title: 'B', days: 0 }, { title: 'C', days: '10' }, { title: 'D', days: 2.5 }, { title: 'E', days: 'ten' }]);

		expect(campaign.habits.map((habit) => [habit.title, habit.days, habit.skills, habit.habiticaId])).toEqual([
			['A', null, [], null],
			['B', null, [], null],
			['C', 10, [], null],
			['D', null, [], null],
			['E', null, [], null],
		]);
	});

	it('reads a note of today, `days: 21` and none of the new fields, as before: 21 days, every day, no checklist', () => {
		expect(withHabits([{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: null }]).habits).toEqual([
			{ title: 'Leer 10 minutos', days: 21, repeat: EVERY_DAY, checklist: [], skills: ['lector'], habiticaId: null, streak: null },
		]);
	});

	it('lowercases skill ids, as the skill tags are, so a campaign and a tag always agree', () => {
		const campaign = withHabits([{ title: 'A', skill: ['Atleta', ' CUIDADOR '] }], { skill: 'Exegeta' });

		expect(campaign.skills).toEqual(['exegeta']);
		expect(campaign.habits[0]?.skills).toEqual(['atleta', 'cuidador']);
	});

	it('skips habits without a title and reads anything that is not a list as no habits', () => {
		expect(withHabits([{ days: 10 }, 'text', null, { title: '  ' }, { title: 'Ok' }]).habits.map((habit) => habit.title)).toEqual(['Ok']);
		for (const habits of [undefined, null, 'x', 7, { title: 'A' }]) expect(withHabits(habits).habits).toEqual([]);
	});

	it('a research has no habits: Dromos never writes there', () => {
		const research = campaignFromNote(note('03 - Areas/Bible/Estudio/Apocrifos/Estudio.md', { type: 'research', status: 'active', habits: [{ title: 'Read' }] }));

		expect(research.habits).toEqual([]);
	});
});

describe('campaign dailies: repeat days and checklist (ADR-021)', () => {
	const habitOf = (fields: Record<string, unknown>) =>
		campaignFromNote(note('02 - Projects/Salto/README.md', { type: 'index', status: 'active', habits: [{ title: 'Caminar', ...fields }] })).habits[0];

	it('reads `repeat` as weekdays, case-insensitive, deduplicated and in week order', () => {
		expect(habitOf({ repeat: ['fri', 'Mon', ' WED ', 'mon'] })?.repeat).toEqual(['mon', 'wed', 'fri']);
		expect(habitOf({ repeat: ['mon', 'tue', 'wed', 'thu', 'fri'] })?.repeat).toEqual(['mon', 'tue', 'wed', 'thu', 'fri']);
	});

	it('drops an unknown or empty entry of `repeat` and keeps the rest', () => {
		expect(habitOf({ repeat: ['mon', 'monday', '', null, 3, 'sun'] })?.repeat).toEqual(['mon', 'sun']);
	});

	it('repeats every day when `repeat` is missing, empty or wholly invalid', () => {
		for (const repeat of [undefined, null, [], ['', 'lunes', 7], {}, 7]) expect(habitOf({ repeat })?.repeat).toEqual(EVERY_DAY);
	});

	it('reads a single weekday written as text as a list of one', () => {
		expect(habitOf({ repeat: 'Sun' })?.repeat).toEqual(['sun']);
	});

	it('reads `checklist` as its non-empty texts, trimmed, in order', () => {
		expect(habitOf({ checklist: [' Agua ', 'Estirar', '', '   ', null, 4, { text: 'x' }, 'Cama'] })?.checklist).toEqual(['Agua', 'Estirar', 'Cama']);
	});

	it('has no checklist when `checklist` is missing or not a list', () => {
		for (const checklist of [undefined, null, 'Agua', 3, {}]) expect(habitOf({ checklist })?.checklist).toEqual([]);
	});
});
