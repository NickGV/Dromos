import { PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { createTranslator, LANGUAGES, languageOrDefault } from '../../i18n';
import { DEFAULT_SETTINGS, type Settings, type SettingsStore } from '../../ports';

/**
 * Settings tab (S3): Habitica credentials, the Dromos vault folder, the stale threshold and the
 * interface language. Every change
 * is saved through the `SettingsStore` and then reported to `onChange`. The token
 * input is masked and its value is never logged.
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
			.addText((text) =>
				text.setValue(settings.habiticaUserId).onChange((value) => void update({ habiticaUserId: value })),
			);

		new Setting(containerEl)
			.setName(t('settings.token.name'))
			.setDesc(t('settings.token.desc'))
			.addText((text) => {
				text.inputEl.type = 'password';
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
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.staleAfterDays))
					.setValue(String(settings.staleAfterDays))
					.onChange((value) => {
						// Ignore half-typed or invalid values; the last valid one stays.
						const days = Number(value);
						if (Number.isInteger(days) && days > 0) void update({ staleAfterDays: days });
					}),
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
