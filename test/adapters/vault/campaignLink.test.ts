import { describe, expect, it } from 'vitest';
import {
    linkHabiticaIdInFrontmatter,
    linkHabitHabiticaIdInFrontmatter,
    relinkHabiticaIdInFrontmatter,
    relinkHabitHabiticaIdInFrontmatter,
} from '../../../src/adapters/vault/campaignLink';

const ID = '3f2a1c8e-0000-4000-8000-000000000001';

function project(tasks: unknown, extra: Record<string, unknown> = {}): Record<string, unknown> {
	return { type: 'index', status: 'active', priority: 'high', phases: [{ id: 'mvp', name: 'MVP', status: 'active' }], tasks, ...extra };
}

describe('linkHabiticaIdInFrontmatter', () => {
	it('writes the id into the first task with that title that has none', () => {
		const frontmatter = project([{ title: 'A', phase: 'mvp', habitica_id: null }, { title: 'B', habitica_id: null }]);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', phase: 'mvp', habitica_id: ID }, { title: 'B', habitica_id: null }]);
	});

	it('treats an empty or missing habitica_id as not sent', () => {
		const frontmatter = project([{ title: 'A', habitica_id: '' }, { title: 'B' }]);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('linked');
		expect(linkHabiticaIdInFrontmatter(frontmatter, 'B', ID)).toBe('linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: ID }, { title: 'B', habitica_id: ID }]);
	});

	it('treats blank text as not sent and replaces it', () => {
		const frontmatter = project([{ title: 'A', habitica_id: '   ' }]);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: ID }]);
	});

	it('never overwrites a value that is not blank, whatever its type', () => {
		for (const value of [0, 5, false, {}, [], ['x']]) {
			const frontmatter = project([{ title: 'A', habitica_id: value }]);
			const before = structuredClone(frontmatter);

			expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('already-linked');
			expect(frontmatter).toEqual(before);
		}
	});

	it('never overwrites an id that is already there', () => {
		const frontmatter = project([{ title: 'A', habitica_id: 'existing-id' }]);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('already-linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: 'existing-id' }]);
	});

	it('skips linked duplicates and links the next unlinked task with the same title', () => {
		const frontmatter = project([{ title: 'A', habitica_id: 'first' }, { title: 'A', habitica_id: null }]);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', ID)).toBe('linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: 'first' }, { title: 'A', habitica_id: ID }]);
	});

	it('is idempotent: a second call finds it linked and changes nothing', () => {
		const frontmatter = project([{ title: 'A', habitica_id: null }]);

		linkHabiticaIdInFrontmatter(frontmatter, 'A', ID);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'A', 'another-id')).toBe('already-linked');
		expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: ID }]);
	});

	it('answers not-found for an unknown title, missing tasks, or a note that is not a project index', () => {
		expect(linkHabiticaIdInFrontmatter(project([{ title: 'A' }]), 'Z', ID)).toBe('not-found');
		expect(linkHabiticaIdInFrontmatter(project(undefined), 'A', ID)).toBe('not-found');
		expect(linkHabiticaIdInFrontmatter(project('text'), 'A', ID)).toBe('not-found');
		expect(linkHabiticaIdInFrontmatter(project([{ title: 'A' }], { type: 'research' }), 'A', ID)).toBe('not-found');
	});

	it('changes nothing but habitica_id', () => {
		const frontmatter = project([{ title: 'A', phase: 'mvp', skill: 'dev', resources: ['[[R]]'], habitica_id: null }], { deadline: '2026-12-15' });
		const before = structuredClone(frontmatter);

		linkHabiticaIdInFrontmatter(frontmatter, 'A', ID);

		expect({ ...frontmatter, tasks: undefined }).toEqual({ ...before, tasks: undefined });
		expect(frontmatter.tasks).toEqual([{ title: 'A', phase: 'mvp', skill: 'dev', resources: ['[[R]]'], habitica_id: ID }]);
	});
});

describe('linkHabitHabiticaIdInFrontmatter', () => {
	it('writes the id into the first habit with that title that has none, and touches nothing else', () => {
		const frontmatter = project([{ title: 'Task', habitica_id: null }], {
			habits: [{ title: 'Stretch', days: 21, habitica_id: null }, { title: 'Sleep', days: 30 }],
		});

		expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Sleep', ID)).toBe('linked');
		expect(frontmatter.habits).toEqual([{ title: 'Stretch', days: 21, habitica_id: null }, { title: 'Sleep', days: 30, habitica_id: ID }]);
		expect(frontmatter.tasks).toEqual([{ title: 'Task', habitica_id: null }]);
	});

	it('never overwrites an id that is already there', () => {
		const frontmatter = project([], { habits: [{ title: 'Stretch', habitica_id: 'existing-id' }] });

		expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Stretch', ID)).toBe('already-linked');
		expect(frontmatter.habits).toEqual([{ title: 'Stretch', habitica_id: 'existing-id' }]);
	});

	it('answers not-found for an unknown habit, missing habits, or a note that is not a project index', () => {
		expect(linkHabitHabiticaIdInFrontmatter(project([], { habits: [{ title: 'A' }] }), 'Z', ID)).toBe('not-found');
		expect(linkHabitHabiticaIdInFrontmatter(project([]), 'A', ID)).toBe('not-found');
		expect(linkHabitHabiticaIdInFrontmatter(project([], { habits: 'text' }), 'A', ID)).toBe('not-found');
		expect(linkHabitHabiticaIdInFrontmatter(project([], { type: 'research', habits: [{ title: 'A' }] }), 'A', ID)).toBe('not-found');
	});

	it('does not link a task through the habit function, nor a habit through the task one', () => {
		const frontmatter = project([{ title: 'Same', habitica_id: null }], { habits: [{ title: 'Same', habitica_id: null }] });

		expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Same', ID)).toBe('linked');
		expect(frontmatter.tasks).toEqual([{ title: 'Same', habitica_id: null }]);
		expect(linkHabiticaIdInFrontmatter(frontmatter, 'Same', 'task-id')).toBe('linked');
		expect(frontmatter.habits).toEqual([{ title: 'Same', habitica_id: ID }]);
	});
});

describe('an area hub: habits only (ADR-017)', () => {
	const archeion = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
		type: 'archeion',
		status: 'active',
		skill: ['lector'],
		habits: [{ title: 'Leer 10 minutos', days: 21, skill: 'lector', habitica_id: null }],
		...extra,
	});

	it('writes the id into the first unsent habit of an archeion, and touches nothing else', () => {
		const frontmatter = archeion({ habits: [{ title: 'Leer 10 minutos', habitica_id: 'first' }, { title: 'Leer 10 minutos', days: 21, habitica_id: '' }] });
		const before = structuredClone(frontmatter);

		expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Leer 10 minutos', ID)).toBe('linked');
		expect(frontmatter).toEqual({ ...before, habits: [{ title: 'Leer 10 minutos', habitica_id: 'first' }, { title: 'Leer 10 minutos', days: 21, habitica_id: ID }] });
	});

	it('never overwrites the id of an archeion habit', () => {
		const frontmatter = archeion({ habits: [{ title: 'Leer 10 minutos', habitica_id: 'existing-id' }] });

		expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Leer 10 minutos', ID)).toBe('already-linked');
		expect(frontmatter.habits).toEqual([{ title: 'Leer 10 minutos', habitica_id: 'existing-id' }]);
	});

	it('still rejects the tasks of an archeion: only a project index has tasks Dromos writes', () => {
		const frontmatter = archeion({ tasks: [{ title: 'Leer 10 minutos', habitica_id: null }] });
		const before = structuredClone(frontmatter);

		expect(linkHabiticaIdInFrontmatter(frontmatter, 'Leer 10 minutos', ID)).toBe('not-found');
		expect(frontmatter).toEqual(before);
	});

	it('still rejects the habits of any type other than index and archeion', () => {
		for (const type of ['research', 'study-session', 'book', 'resource', undefined]) {
			const frontmatter = archeion({ type });
			const before = structuredClone(frontmatter);

			expect(linkHabitHabiticaIdInFrontmatter(frontmatter, 'Leer 10 minutos', ID)).toBe('not-found');
			expect(frontmatter).toEqual(before);
		}
	});
});

describe('relinkHabiticaIdInFrontmatter: "Send again" replaces only the id Habitica confirmed gone (ADR-021)', () => {
    const OLD = '3f2a1c8e-0000-4000-8000-0000000000aa';

    it('replaces the id of the task that still holds the old one, and changes nothing else', () => {
        const frontmatter = project([{ title: 'A', phase: 'mvp', skill: 'dev', habitica_id: OLD }, { title: 'B', habitica_id: 'other' }], { deadline: '2026-12-15', habits: [{ title: 'A', habitica_id: OLD }] });
        const before = structuredClone(frontmatter);

        expect(relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, ID)).toBe('relinked');
        expect(frontmatter).toEqual({ ...before, tasks: [{ title: 'A', phase: 'mvp', skill: 'dev', habitica_id: ID }, { title: 'B', habitica_id: 'other' }] });
    });

    it('refuses, and writes nothing, when the note no longer holds the old id', () => {
        for (const now of ['another-id', null, '', undefined, 7]) {
            const frontmatter = project([{ title: 'A', habitica_id: now }]);
            const before = structuredClone(frontmatter);

            expect(relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, ID)).toBe('changed');
            expect(frontmatter).toEqual(before);
        }
    });

    it('refuses for a title the note no longer has, a missing list, or a note Dromos does not write', () => {
        for (const frontmatter of [project([{ title: 'Z', habitica_id: OLD }]), project(undefined), project('text'), project([{ title: 'A', habitica_id: OLD }], { type: 'research' })]) {
            const before = structuredClone(frontmatter);

            expect(relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, ID)).toBe('changed');
            expect(frontmatter).toEqual(before);
        }
    });

    it('reads the old id as the mapper does, trimmed, and replaces the first entry with that title that holds it', () => {
        const frontmatter = project([{ title: 'A', habitica_id: 'kept' }, { title: 'A', habitica_id: ` ${OLD} ` }, { title: 'A', habitica_id: OLD }]);

        expect(relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, ID)).toBe('relinked');
        expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: 'kept' }, { title: 'A', habitica_id: ID }, { title: 'A', habitica_id: OLD }]);
    });

    it('is a compare-and-swap: a second replace of the same old id finds it gone and changes nothing', () => {
        const frontmatter = project([{ title: 'A', habitica_id: OLD }]);
        relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, ID);

        expect(relinkHabiticaIdInFrontmatter(frontmatter, 'A', OLD, 'third-id')).toBe('changed');
        expect(frontmatter.tasks).toEqual([{ title: 'A', habitica_id: ID }]);
    });
});

describe('relinkHabitHabiticaIdInFrontmatter (ADR-021)', () => {
    const OLD = '3f2a1c8e-0000-4000-8000-0000000000aa';

    it('replaces the id of the habit that still holds the old one, in a project and in an archeion, and changes nothing else', () => {
        for (const extra of [{}, { type: 'archeion', tasks: undefined }]) {
            const frontmatter = project([{ title: 'Caminar', habitica_id: OLD }], {
                habits: [{ title: 'Caminar', days: 21, repeat: ['mon', 'fri'], checklist: ['Zapatillas'], habitica_id: OLD }, { title: 'Dormir', habitica_id: OLD }],
                ...extra,
            });
            const before = structuredClone(frontmatter);

            expect(relinkHabitHabiticaIdInFrontmatter(frontmatter, 'Caminar', OLD, ID)).toBe('relinked');
            expect(frontmatter).toEqual({ ...before, habits: [{ title: 'Caminar', days: 21, repeat: ['mon', 'fri'], checklist: ['Zapatillas'], habitica_id: ID }, { title: 'Dormir', habitica_id: OLD }] });
        }
    });

    it('refuses, and writes nothing, when the habit no longer holds the old id', () => {
        const frontmatter = project([], { habits: [{ title: 'Caminar', habitica_id: 'edited-by-hand' }] });
        const before = structuredClone(frontmatter);

        expect(relinkHabitHabiticaIdInFrontmatter(frontmatter, 'Caminar', OLD, ID)).toBe('changed');
        expect(frontmatter).toEqual(before);
    });

    it('never replaces a task through the habit function', () => {
        const frontmatter = project([{ title: 'Same', habitica_id: OLD }], { habits: [] });
        const before = structuredClone(frontmatter);

        expect(relinkHabitHabiticaIdInFrontmatter(frontmatter, 'Same', OLD, ID)).toBe('changed');
        expect(frontmatter).toEqual(before);
    });
});
