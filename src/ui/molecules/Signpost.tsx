import type { MessageKey } from '../../i18n';
import { useT } from '../i18n';

/**
 * The screens inside the Dromos view (game-ui S1), the library added by M7 (S5), the Chronicle by
 * M9 (S3), which has no plank: it is reached from the home chronicle and belongs to the path, and the
 * Shop by M10 (S4).
 */
export type DromosScreen = 'home' | 'campaigns' | 'skills' | 'library' | 'shop' | 'chronicle';

/** The screens with a plank of their own, in the signpost's order. */
type PlankScreen = Exclude<DromosScreen, 'chronicle'>;

const SCREENS: readonly { readonly id: PlankScreen; readonly label: MessageKey }[] = [
	{ id: 'home', label: 'nav.home' },
	{ id: 'campaigns', label: 'nav.campaigns' },
	{ id: 'skills', label: 'nav.skills' },
	{ id: 'library', label: 'nav.library' },
	{ id: 'shop', label: 'nav.shop' },
];

export interface SignpostProps {
	/** The screen on show: its plank is burnt in and marked as the page; the Chronicle's is Path (M9 S3). */
	readonly current: DromosScreen;
	readonly onGo: (screen: DromosScreen) => void;
	/** Opens the plugin's settings tab; `null` where it cannot be opened, and the plank does not show. */
	readonly onSettings: (() => void) | null;
}

/**
 * The signpost inside the scene (S1): its six planks always in the same order, one per screen
 * (the library fourth, M7 S5, the Shop fifth, M10 S4) and then the settings (game-ui S14), so a plank
 * never moves under the pointer. The stylesheet hangs them three a side of the post, so six fit on a
 * phone. The current
 * screen's plank is burnt into the wood and carries `aria-current="page"`; its name is its label.
 * The others are named "Go to X", so the visible label is part of the accessible name. The Chronicle
 * has no plank of its own: while it is shown, Path is burnt in (M9 S3), as a shelf keeps the Library's.
 */
export function Signpost({ current, onGo, onSettings }: SignpostProps) {
	const t = useT();
	const here: PlankScreen = current === 'chronicle' ? 'home' : current;
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
			{SCREENS.map((screen) => plank(screen.id, t(screen.label), () => onGo(screen.id), screen.id === here))}
			{onSettings ? plank('settings', t('nav.settings'), onSettings) : null}
		</nav>
	);
}
