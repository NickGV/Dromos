import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en';
import { es } from '../../src/i18n/es';
import { DEFAULT_LANGUAGE, LANGUAGES, createTranslator, languageOrDefault, plural } from '../../src/i18n';

const placeholders = (text: string): string[] => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1] ?? '').sort();

describe('catalogs', () => {
	it('define the same keys in English and in Spanish', () => {
		expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
	});

	it('use the same placeholders in both languages for every key', () => {
		for (const key of Object.keys(en) as (keyof typeof en)[]) {
			expect(placeholders(es[key]), key).toEqual(placeholders(en[key]));
		}
	});

	it('have no empty text, except the fragments that sit next to markup', () => {
		for (const [key, text] of [...Object.entries(en), ...Object.entries(es)]) {
			expect(text.trim() === '' && !key.includes('.after') && !key.includes('.before'), key).toBe(false);
		}
	});
});

describe('createTranslator', () => {
	it('knows both languages and defaults to English', () => {
		expect([...LANGUAGES]).toEqual(['en', 'es']);
		expect(DEFAULT_LANGUAGE).toBe('en');
	});

	it('translates a key', () => {
		expect(createTranslator('en')('action.sync')).toBe('Sync');
		expect(createTranslator('es')('action.sync')).toBe('Sincronizar');
	});

	it('fills placeholders and leaves an unknown one visible', () => {
		const t = createTranslator('en');

		expect(t('character.level', { level: 4 })).toBe('Level 4');
		expect(t('character.level')).toBe('Level {level}');
		expect(createTranslator('es')('character.level', { level: 4, extra: 'x' })).toBe('Nivel 4');
	});

	it('does not read a placeholder value as a template', () => {
		expect(createTranslator('en')('campaign.progress.aria', { title: '{level} $& {title}' })).toBe('Progress of {level} $& {title}');
	});
});

describe('plural', () => {
	it('picks the .one text for exactly 1 and .other otherwise, with count available', () => {
		for (const language of LANGUAGES) {
			const t = createTranslator(language);
			expect(plural(t, 'campaign.tasks', 1)).toBe(t('campaign.tasks.one', { count: 1 }));
			expect(plural(t, 'campaign.tasks', 0)).toBe(t('campaign.tasks.other', { count: 0 }));
			expect(plural(t, 'campaign.tasks', 5)).toBe(t('campaign.tasks.other', { count: 5 }));
		}
		expect(plural(createTranslator('en'), 'campaign.tasks', 3)).toBe('3 tasks');
		expect(plural(createTranslator('es'), 'campaign.tasks', 1)).toBe('1 tarea');
	});
});

describe('languageOrDefault', () => {
	it('keeps a known language and falls back to English for anything else', () => {
		expect(languageOrDefault('es')).toBe('es');
		expect(languageOrDefault('en')).toBe('en');
		for (const value of ['fr', '', 'ES', null, undefined, 3, {}]) expect(languageOrDefault(value)).toBe('en');
	});
});
