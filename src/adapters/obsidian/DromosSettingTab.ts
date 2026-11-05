import { PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { createTranslator, LANGUAGES, languageOrDefault } from '../../i18n';
import { DEFAULT_SETTINGS, type Settings, type SettingsStore } from '../../ports';

/**
 * Settings tab (S3): Habitica credentials, the Dromos vault folder, the stale threshold, opening
 * Dromos on startup and the interface language. Every change
 * is saved through the `SettingsStore` and then reported to `onChange`. The token
 * input is masked and its value is never logged.
 *
 * The lint warning `obsidianmd/settings-tab/prefer-setting-definitions` stays on purpose (issue #9):
 * `getSettingDefinitions()` arrived in Obsidian 1.13.0, and the installed typings are 1.12.3. With
 * `minAppVersion` at 1.7.2, `display()` would still be needed, so every setting would be written twice,
 * and the declarative token field (`secret`) keeps the token in `app.secretStorage`, while ADR-007 keeps it
 * in `data.json`. All it would give is Dromos's settings in Obsidian's settings search on 1.13 or later.
 */
export class DromosSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		plugin: Plugin,
		private readonly store: SettingsStore,
		/** Called after each saved change (every keystroke) with the full new settings. */
		private readonly onChange?: (settings: Settings) => void,
	) {
		super(app, plugin);
	}

	display(): void {
		void this.render();
	}

	private async render(): Promise<void> {
		let settings = await this.store.load();
		const update = async (patch: Partial<Settings>): Promise<void> => {
			settings = { ...settings, ...patch };
			await this.store.save(settings);
			this.onChange?.(settings);
		};

		const t = createTranslator(settings.language);
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t('settings.userId.name'))
			.setDesc(t('settings.userId.desc'))
			.addText((text) => {
				plainCode(text.inputEl);
				text.setValue(settings.habiticaUserId).onChange((value) => void update({ habiticaUserId: value }));
			});

		new Setting(containerEl)
			.setName(t('settings.token.name'))
			.setDesc(t('settings.token.desc'))
			.addText((text) => {
				text.inputEl.type = 'password';
				plainCode(text.inputEl);
				text.setValue(settings.habiticaApiToken).onChange((value) => void update({ habiticaApiToken: value }));
			});

		new Setting(containerEl)
			.setName(t('settings.folder.name'))
			.setDesc(t('settings.folder.desc'))
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.vaultFolder)
					.setValue(settings.vaultFolder)
					.onChange((value) => void update({ vaultFolder: value })),
			);

		new Setting(containerEl)
			.setName(t('settings.stale.name'))
			.setDesc(t('settings.stale.desc'))
			.addText((text) => {
				// A number pad on phones; the type stays text so a half-typed value can be ignored.
				text.inputEl.inputMode = 'numeric';
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.staleAfterDays))
					.setValue(String(settings.staleAfterDays))
					.onChange((value) => {
						// Ignore half-typed or invalid values; the last valid one stays.
						const days = Number(value);
						if (Number.isInteger(days) && days > 0) void update({ staleAfterDays: days });
					});
			});

		new Setting(containerEl)
			.setName(t('settings.openOnStartup.name'))
			.setDesc(t('settings.openOnStartup.desc'))
			.addToggle((toggle) =>
				toggle.setValue(settings.openOnStartup).onChange((value) => void update({ openOnStartup: value })),
			);

		new Setting(containerEl)
			.setName(t('settings.language.name'))
			.setDesc(t('settings.language.desc'))
			.addDropdown((dropdown) => {
				for (const language of LANGUAGES) dropdown.addOption(language, t(`settings.language.${language}`));
				dropdown.setValue(settings.language).onChange((value) => {
					// Saved first, then the tab is drawn again so its own text switches too.
					void update({ language: languageOrDefault(value) }).then(() => this.display());
				});
			});
	}
}

/** An input that holds a code: no capital letter, spelling fix or autofill added by the device. */
function plainCode(input: HTMLInputElement): void {
	input.autocapitalize = 'off';
	input.spellcheck = false;
	input.autocomplete = 'off';
}
