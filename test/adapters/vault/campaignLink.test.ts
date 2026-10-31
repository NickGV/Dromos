import { describe, expect, it } from 'vitest';
import { linkHabiticaIdInFrontmatter } from '../../../src/adapters/vault/campaignLink';

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
