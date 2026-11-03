import { Landscape } from '../atoms/Landscape';
import { Signpost, type DromosScreen } from '../molecules/Signpost';

export interface SceneProps {
	readonly screen: DromosScreen;
	/** Habitica cannot be reached: the scene loses its color (S10). */
	readonly offline: boolean;
	readonly onGo: (screen: DromosScreen) => void;
	readonly onSettings: (() => void) | null;
}

/**
 * The scene above every screen (S1): the landscape, tall on the home screen and short on the
 * others, with the signpost to the other screens planted in it. The card that opens the screen
 * overlaps its foot.
 */
export function Scene({ screen, offline, onGo, onSettings }: SceneProps) {
	const classes = ['dromos-scene', screen === 'home' ? 'is-home' : null, offline ? 'is-offline' : null].filter((name) => name !== null).join(' ');
	return (
		<div className={classes}>
			<Landscape />
			<Signpost current={screen} onGo={onGo} onSettings={onSettings} />
		</div>
	);
}
