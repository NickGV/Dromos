import { PluginSettingTab, Setting, type App, type Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, type Settings, type SettingsStore } from '../../ports';

/**
 * Settings tab (S3): Habitica credentials, the Dromos vault folder and the stale threshold. Every change
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

		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('ID de usuario de Habitica')
			.setDesc('Identifica tu cuenta al consultar tus tareas.')
			.addText((text) =>
				text.setValue(settings.habiticaUserId).onChange((value) => void update({ habiticaUserId: value })),
			);

		new Setting(containerEl)
			.setName('Token de API de Habitica')
			.setDesc('Se guarda solo en los datos del plugin en este dispositivo.')
			.addText((text) => {
				text.inputEl.type = 'password';
				text.setValue(settings.habiticaApiToken).onChange((value) => void update({ habiticaApiToken: value }));
			});

		new Setting(containerEl)
			.setName('Carpeta de Dromos')
			.setDesc('Carpeta de la bóveda que contiene Character.md.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_SETTINGS.vaultFolder)
					.setValue(settings.vaultFolder)
					.onChange((value) => void update({ vaultFolder: value })),
			);

		new Setting(containerEl)
			.setName('Días para marcar una campaña como detenida')
			.setDesc('Días sin completar ninguna tarea antes de marcar una campaña activa como detenida. Cada campaña puede fijar el suyo con stale_after_days.')
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
	}
}
