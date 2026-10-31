import { createContext, useContext, type ReactNode } from 'react';
import { createTranslator, DEFAULT_LANGUAGE, type Translator } from '../i18n';

const I18nContext = createContext<Translator>(createTranslator(DEFAULT_LANGUAGE));

/** Gives every component below it the translator of the language chosen in the settings. */
export function I18nProvider({ t, children }: { readonly t: Translator; readonly children: ReactNode }) {
	return <I18nContext.Provider value={t}>{children}</I18nContext.Provider>;
}

/** The translator for the interface language. English when there is no provider. */
export function useT(): Translator {
	return useContext(I18nContext);
}
