import { en } from './en';
import { es } from './es';
import type { MessageKey, PluralBase } from './keys';

export const LANGUAGES = ['en', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';

export type TranslationParams = Readonly<Record<string, string | number>>;

/** Returns the copy for `key` with its `{placeholders}` filled; an unknown placeholder stays visible. */
export type Translator = (key: MessageKey, params?: TranslationParams) => string;

const CATALOGS: Readonly<Record<Language, Readonly<Record<MessageKey, string>>>> = { en, es };

export function createTranslator(language: Language): Translator {
	const catalog = CATALOGS[language];
	// A function replacer, so a value that holds `$&` or `{name}` is inserted as plain text.
	return (key, params) => catalog[key].replace(/\{(\w+)\}/g, (placeholder, name: string) => (params && name in params ? String(params[name]) : placeholder));
}

/** `<base>.one` for exactly 1, `<base>.other` otherwise; `{count}` is always available. */
export function plural(t: Translator, base: PluralBase, count: number, params: TranslationParams = {}): string {
	return t(`${base}.${count === 1 ? 'one' : 'other'}`, { ...params, count });
}

/** A supported language from an untrusted value (a hand-edited `data.json`), else English. */
export function languageOrDefault(value: unknown): Language {
	return LANGUAGES.find((language) => language === value) ?? DEFAULT_LANGUAGE;
}
