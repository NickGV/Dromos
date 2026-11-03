import type { MessageKey } from '../../i18n';
import { useT } from '../i18n';

/** The screens inside the Dromos view (game-ui S1). */
export type DromosScreen = 'home' | 'campaigns' | 'skills';

const SCREENS: readonly { readonly id: DromosScreen; readonly label: MessageKey }[] = [
	{ id: 'home', label: 'nav.home' },
	{ id: 'campaigns', label: 'nav.campaigns' },
	{ id: 'skills', label: 'nav.skills' },
];

export interface SignpostProps {
	/** The screen on show: its plank is left out. */
	readonly current: DromosScreen;
	readonly onGo: (screen: DromosScreen) => void;
	/** Opens the plugin's settings tab; `null` where it cannot be opened, and the plank does not show. */
	readonly onSettings: (() => void) | null;
}

/**
 * The signpost inside the scene (S1): one wooden plank per screen other than the current one,
 * then the settings. Each plank is a button named "Go to X", so the visible label is part of
 * its accessible name.
 */
export function Signpost({ current, onGo, onSettings }: SignpostProps) {
	const t = useT();
	const plank = (key: string, label: string, onClick: () => void) => (
		<button key={key} type="button" className="dromos-plank" aria-label={t('nav.goTo', { screen: label })} onClick={onClick}>
			{label}
		</button>
	);
	return (
		<nav className="dromos-signpost" aria-label={t('nav.aria')}>
			{SCREENS.filter((screen) => screen.id !== current).map((screen) => plank(screen.id, t(screen.label), () => onGo(screen.id)))}
			{onSettings ? plank('settings', t('nav.settings'), onSettings) : null}
		</nav>
	);
}
