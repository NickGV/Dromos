import { describe, expect, it } from 'vitest';
import { characterNotePath, normalizeVaultFolder } from '../../../src/adapters/vault/folderPath';

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
