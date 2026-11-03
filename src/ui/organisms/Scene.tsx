import type { ReactNode } from 'react';
import { GatePlaque } from '../atoms/GatePlaque';
import { Landscape } from '../atoms/Landscape';
import { Walker } from '../atoms/Walker';
import { Signpost, type DromosScreen } from '../molecules/Signpost';

export interface SceneProps {
	readonly screen: DromosScreen;
	/** Habitica cannot be reached: the scene loses its color (S10). */
	readonly offline: boolean;
	readonly onGo: (screen: DromosScreen) => void;
	readonly onSettings: (() => void) | null;
	/** Drawn over the landscape: the level-up ribbon (game-ui S4), or nothing. */
	readonly ribbon?: ReactNode;
	/** Where the walker stands on the road, as a share of the level (game-ui S16); `null` at the start. */
	readonly walker?: number | null;
	/** What the gate at the road's end says, "Level 6"; `null` leaves it unmarked. */
	readonly gateLabel?: string | null;
}

/**
 * The scene above every screen (S1): the landscape, tall on the home screen and short on the
 * others, with the walker on the road and the gate of the next level at its end (S16), the
 * signpost to the other screens planted in it and, at a level-up, the ribbon over it. The card
 * that opens the screen overlaps its foot.
 */
export function Scene({ screen, offline, onGo, onSettings, ribbon = null, walker = null, gateLabel = null }: SceneProps) {
	const classes = ['dromos-scene', screen === 'home' ? 'is-home' : null, offline ? 'is-offline' : null].filter((name) => name !== null).join(' ');
	return (
		<div className={classes}>
			<Landscape>
				<Walker fraction={walker} />
			</Landscape>
			{gateLabel ? <GatePlaque label={gateLabel} /> : null}
			<Signpost current={screen} onGo={onGo} onSettings={onSettings} />
			{ribbon}
		</div>
	);
}
