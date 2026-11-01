import { describe, expect, it } from 'vitest';
import { characterNotePath, ledgerFolderPath, ledgerNotePath, normalizeVaultFolder, rulesNotePath, skillNotePath, skillsFolderPath } from '../../../src/adapters/vault/folderPath';

describe('normalizeVaultFolder', () => {
	it('keeps a clean folder as is', () => {
		expect(normalizeVaultFolder('Dromos')).toBe('Dromos');
		expect(normalizeVaultFolder('Notas/Dromos')).toBe('Notas/Dromos');
	});

	it('trims surrounding whitespace', () => {
		expect(normalizeVaultFolder('  Notas/Dromos  ')).toBe('Notas/Dromos');
	});

	it('strips trailing slashes, also when mixed with whitespace', () => {
		expect(normalizeVaultFolder('Dromos/')).toBe('Dromos');
		expect(normalizeVaultFolder('Notas/Dromos///')).toBe('Notas/Dromos');
		expect(normalizeVaultFolder(' Dromos / ')).toBe('Dromos');
	});

	it('falls back to the default folder when nothing is left', () => {
		expect(normalizeVaultFolder('')).toBe('Dromos');
		expect(normalizeVaultFolder('   ')).toBe('Dromos');
		expect(normalizeVaultFolder('///')).toBe('Dromos');
	});
});

describe('characterNotePath', () => {
	it('places Character.md inside the normalized folder', () => {
		expect(characterNotePath('Dromos')).toBe('Dromos/Character.md');
		expect(characterNotePath(' Notas/Dromos/ ')).toBe('Notas/Dromos/Character.md');
		expect(characterNotePath('')).toBe('Dromos/Character.md');
	});
});

describe('rulesNotePath', () => {
	it('sits next to the character note, under the normalized folder', () => {
		expect(rulesNotePath('Dromos')).toBe('Dromos/Rules.md');
		expect(rulesNotePath(' Game/ ')).toBe('Game/Rules.md');
	});
});

describe('skills and ledger paths', () => {
	it('places the skills and the monthly ledger notes inside the normalized folder', () => {
		expect(skillsFolderPath(' Notas/Dromos/ ')).toBe('Notas/Dromos/Skills');
		expect(skillNotePath('Dromos', 'lector')).toBe('Dromos/Skills/lector.md');
		expect(ledgerFolderPath('Dromos/')).toBe('Dromos/Ledger');
		expect(ledgerNotePath('Dromos', '2026-11')).toBe('Dromos/Ledger/2026-11.md');
	});

	it('falls back to the default folder', () => {
		expect(skillNotePath('', 'lector')).toBe('Dromos/Skills/lector.md');
		expect(ledgerNotePath('///', '2026-11')).toBe('Dromos/Ledger/2026-11.md');
	});
});
