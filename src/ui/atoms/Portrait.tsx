import { useId, type ReactNode } from 'react';
import type { AvatarView } from '../presenters/avatar';
import { Bust } from './avatar/Bust';
import { Scribe } from './portrait/Scribe';

/** The opening of the niche, a round arch on its two jambs, in the 100 x 124 box. */
const ARCH = 'M7 124V50C7 26 26.2 7 50 7S93 26 93 50V124Z';
/** The niche's outer edge, the frame around the arch. */
const FRAME = 'M1.5 124V50C1.5 23 23.2 1.5 50 1.5S98.5 23 98.5 50V124Z';

/**
 * A painted panel portrait of the era (M11 S1-S2): a figure under a round arch, its field the sky
 * for the character and lamplight for the scribe, clipped to the arch, with a molding along it. It
 * is decoration, hidden from screen readers; the clip's id is unique in the window, so two open views
 * never share it.
 */
function Niche({ who, place, children }: { readonly who: 'character' | 'scribe'; readonly place: string; readonly children: ReactNode }) {
	const clip = `dromos-portrait-${who}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
	return (
		<svg className={`dromos-portrait-art is-niche is-${who}`} viewBox="0 0 100 124" aria-hidden="true" focusable="false">
			<defs>
				<clipPath id={clip}>
					<path d={ARCH} />
				</clipPath>
			</defs>
			<path className="dromos-portrait-frame" d={FRAME} />
			<path className="dromos-portrait-field" d={ARCH} />
			<g clipPath={`url(#${clip})`}>
				<g transform={place}>{children}</g>
			</g>
			<path className="dromos-portrait-molding" d={ARCH} />
		</svg>
	);
}

/**
 * The character's portrait on the plaque (M11 S1): the figure under his arch at the stage he has
 * reached, from the young runner of the road to the sage, with the objects of his highest skills.
 */
export function CharacterPortrait({ avatar }: { readonly avatar: AvatarView }) {
	return (
		<Niche who="character" place="translate(-10 10) scale(1.2)">
			<Bust avatar={avatar} />
		</Niche>
	);
}

/**
 * The plaque's portrait as a button (stage-card S1): it holds the niche alone, so the level medallion
 * beside it keeps its own name, and it opens the stage card, a dialog. Obsidian shows its name as
 * the tooltip, so the name stays short.
 */
export function PortraitButton({ label, onOpen, children }: { readonly label: string; readonly onOpen: () => void; readonly children: ReactNode }) {
	return (
		<button type="button" className="dromos-portrait-open" aria-label={label} aria-haspopup="dialog" onClick={onOpen}>
			{children}
		</button>
	);
}

/** Esdras's portrait in his letter: the scribe under a smaller arch (M11 S2). */
export function ScribePortrait() {
	return (
		<Niche who="scribe" place="translate(-5 17) scale(1.1)">
			<Scribe />
		</Niche>
	);
}

/**
 * A new letter's ochre wax seal (game-ui S13, M11 S2), pressed on the corner of Esdras's portrait:
 * the wax with its pale ring and a pressed star, two clay ribbon ends under it.
 */
export function WaxSeal() {
	return (
		<svg className="dromos-portrait-seal" viewBox="0 0 24 26" aria-hidden="true" focusable="false">
			<path className="dromos-portrait-ribbon" d="M9 15.6L6 25.4L8.8 23.6L10.6 25.6L12.4 16.4ZM15 15.6L18 25.4L15.2 23.6L13.4 25.6L11.6 16.4Z" />
			<path
				className="dromos-portrait-wax"
				d="M12 1.4C13.6 1.4 14.4 2.6 15.8 2.8C17.4 3 18.6 2.6 19.6 3.8C20.6 5 20.2 6.4 20.8 7.8C21.4 9.2 22.6 10 22.6 11.6C22.6 13.2 21.4 14 20.8 15.4C20.2 16.8 20.6 18.2 19.6 19.4C18.6 20.6 17.2 20.2 15.8 20.6C14.4 21 13.6 22 12 22C10.4 22 9.6 21 8.2 20.6C6.8 20.2 5.4 20.6 4.4 19.4C3.4 18.2 3.8 16.8 3.2 15.4C2.6 14 1.4 13.2 1.4 11.6C1.4 10 2.6 9.2 3.2 7.8C3.8 6.4 3.4 5 4.4 3.8C5.4 2.6 6.6 3 8.2 2.8C9.6 2.6 10.4 1.4 12 1.4Z"
			/>
			<circle className="dromos-portrait-wax-ring" cx="12" cy="11.7" r="6.4" />
			<path className="dromos-portrait-wax-mark" d="M12 7.6L13.1 10.4L16 10.6L13.8 12.5L14.5 15.4L12 13.8L9.5 15.4L10.2 12.5L8 10.6L10.9 10.4Z" />
		</svg>
	);
}
