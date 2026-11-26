import type { ReactNode } from 'react';
import { Campfire } from '../atoms/Campfire';
import { GatePlaque } from '../atoms/GatePlaque';
import { Landscape, LandscapeArt } from '../atoms/Landscape';
import { Walker } from '../atoms/Walker';
import { Signpost, type DromosScreen } from '../molecules/Signpost';
import { FIRST_AVATAR, type AvatarView } from '../presenters/avatar';
import type { DayPeriod } from '../presenters/dayPeriod';
import type { LandscapeArtView } from '../presenters/landscapeArtView';

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
	/** The time of day the sky shows (game-ui S17); the stylesheet sets its colors from it. */
	readonly period?: DayPeriod;
	/** Every daily is done: a campfire burns beside the road (game-ui S17). */
	readonly campfire?: boolean;
	/** Who walks the road (M11 S1): the character's stage and the objects of its skills; the young runner by default. */
	readonly avatar?: AvatarView;
	/** The user's painting of the landscape for this time of day (landscape-art S1); absent or `null`, the landscape is drawn. */
	readonly painting?: LandscapeArtView | null;
}

/**
 * The scene above every screen (S1): the same landscape on each (home-header S2), tall enough for
 * the walker, the gate and its plaque to stay whole, with the walker on the road (the character at
 * the stage reached, with the objects of its skills, M11 S1) and the gate of the next level at its
 * end (S16), the signpost to the other screens planted in it and, at a level-up, the ribbon over it. The character's plaque follows it, in its corner on wide panes;
 * nothing overlaps its foot. The world reacts (S17): the sky follows the time of day, through
 * `data-period`, and a campfire burns on a complete day. With the user's painting (landscape-art S1-S3)
 * the painting takes the drawn landscape's place behind the gate, the walker and the campfire, in each
 * theme that has one.
 */
export function Scene({ screen, offline, onGo, onSettings, ribbon = null, walker = null, gateLabel = null, period = 'day', campfire = false, avatar = FIRST_AVATAR, painting = null }: SceneProps) {
	const classes = ['dromos-scene', offline ? 'is-offline' : null, painting?.className].filter(Boolean).join(' ');
	return (
		<div className={classes} data-period={period} style={painting?.style}>
			{painting ? <LandscapeArt videos={painting.videos} /> : null}
			<Landscape painted={painting?.painted ?? 'none'}>
				{campfire ? <Campfire /> : null}
				<Walker fraction={walker} avatar={avatar} />
			</Landscape>
			{gateLabel ? <GatePlaque label={gateLabel} /> : null}
			<Signpost current={screen} onGo={onGo} onSettings={onSettings} />
			{ribbon}
		</div>
	);
}
