import type { MessageKey } from '../../i18n';
import { useT } from '../i18n';

/** The screens inside the Dromos view (game-ui S1), the library added by M7 (S5). */
export type DromosScreen = 'home' | 'campaigns' | 'skills' | 'library';

const SCREENS: readonly { readonly id: DromosScreen; readonly label: MessageKey }[] = [
	{ id: 'home', label: 'nav.home' },
	{ id: 'campaigns', label: 'nav.campaigns' },
	{ id: 'skills', label: 'nav.skills' },
	{ id: 'library', label: 'nav.library' },
];

export interface SignpostProps {
	/** The screen on show: its plank is burnt in and marked as the page. */
	readonly current: DromosScreen;
	readonly onGo: (screen: DromosScreen) => void;
	/** Opens the plugin's settings tab; `null` where it cannot be opened, and the plank does not show. */
	readonly onSettings: (() => void) | null;
}

/**
 * The signpost inside the scene (S1): its five planks always in the same order, one per screen
 * (the library fourth, M7 S5) and then the settings (game-ui S14), so a plank never moves under
 * the pointer. The stylesheet hangs them on both sides of the post, so five fit on a phone. The current
 * screen's plank is burnt into the wood and carries `aria-current="page"`; its name is its label.
 * The others are named "Go to X", so the visible label is part of the accessible name.
 */
export function Signpost({ current, onGo, onSettings }: SignpostProps) {
	const t = useT();
	const plank = (key: string, label: string, onClick: () => void, here = false) => (
		<button
			key={key}
			type="button"
			className={here ? 'dromos-plank is-current' : 'dromos-plank'}
			aria-label={here ? undefined : t('nav.goTo', { screen: label })}
			aria-current={here ? 'page' : undefined}
			onClick={onClick}
		>
			{label}
		</button>
	);
	return (
		<nav className="dromos-signpost" aria-label={t('nav.aria')}>
			{SCREENS.map((screen) => plank(screen.id, t(screen.label), () => onGo(screen.id), screen.id === current))}
			{onSettings ? plank('settings', t('nav.settings'), onSettings) : null}
		</nav>
	);
}
