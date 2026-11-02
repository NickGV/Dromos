import { describe, expect, it } from 'vitest';
import type { RebuildOutcome } from '../../src/application';
import { createTranslator } from '../../src/i18n';
import { rebuildMessage } from '../../src/ui/presenters/rebuildView';

const rebuilt = (overrides: Partial<Extract<RebuildOutcome, { kind: 'rebuilt' }>> = {}): RebuildOutcome => ({
	kind: 'rebuilt',
	level: 3,
	totalXp: 400,
	createdCharacter: false,
	unreadableRows: 0,
	...overrides,
});

describe('rebuildMessage: what the command answers (S17)', () => {
	const en = createTranslator('en');
	const es = createTranslator('es');

	it('says where the character stands', () => {
		expect(rebuildMessage(rebuilt(), en)).toBe('State rebuilt from the ledger: level 3, 400 XP.');
		expect(rebuildMessage(rebuilt(), es)).toBe('Estado reconstruido desde el registro: nivel 3, 400 XP.');
	});

	it('warns that a note created again has no name or title', () => {
		expect(rebuildMessage(rebuilt({ createdCharacter: true }), en)).toBe('State rebuilt from the ledger: level 3, 400 XP. Character.md was created again: add your name and title back.');
		expect(rebuildMessage(rebuilt({ createdCharacter: true }), es)).toBe('Estado reconstruido desde el registro: nivel 3, 400 XP. Character.md se creó de nuevo: vuelve a poner tu nombre y tu título.');
	});

	it('warns that unreadable rows were left out, in the singular and the plural', () => {
		expect(rebuildMessage(rebuilt({ unreadableRows: 1 }), en)).toBe('State rebuilt from the ledger: level 3, 400 XP. 1 ledger row could not be read and was left out.');
		expect(rebuildMessage(rebuilt({ unreadableRows: 4 }), en)).toBe('State rebuilt from the ledger: level 3, 400 XP. 4 ledger rows could not be read and were left out.');
		expect(rebuildMessage(rebuilt({ unreadableRows: 1 }), es)).toBe('Estado reconstruido desde el registro: nivel 3, 400 XP. 1 fila del registro no se pudo leer y quedó fuera.');
		expect(rebuildMessage(rebuilt({ unreadableRows: 4 }), es)).toBe('Estado reconstruido desde el registro: nivel 3, 400 XP. 4 filas del registro no se pudieron leer y quedaron fuera.');
	});

	it('says when it failed, and that the ledger is untouched', () => {
		expect(rebuildMessage({ kind: 'failed' }, en)).toBe('The state could not be rebuilt. The ledger was not changed.');
		expect(rebuildMessage({ kind: 'failed' }, es)).toBe('No se pudo reconstruir el estado. El registro no cambió.');
	});
});
