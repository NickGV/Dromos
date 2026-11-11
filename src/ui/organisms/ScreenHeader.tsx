import type { ReactNode } from 'react';

/** A way back to the screen above, "← Biblioteca" (M7 S5). */
export interface ScreenHeaderBack {
	readonly label: string;
	/** Its accessible name, which holds the label: "Volver a la biblioteca". */
	readonly ariaLabel: string;
	readonly onBack: () => void;
}

export interface ScreenHeaderProps {
	readonly title: string;
	/** Given inside a screen, as on a shelf of the library: the back link above the title. */
	readonly back?: ScreenHeaderBack;
	/** Drawn at the card's other end, as the Shop's gold (M10 S4); nothing when absent. */
	readonly aside?: ReactNode;
}

/**
 * The header card that opens every screen other than home (S1): the screen's name, which takes
 * the focus when the screen opens. Inside a screen (a shelf of the library) a back link sits above
 * the title. The character is on the plaque under the scene now (S2), so the card no longer names it.
 * A screen may hang something at the card's other end, as the Shop hangs its gold (M10 S4).
 */
export function ScreenHeader({ title, back, aside }: ScreenHeaderProps) {
	const classes = ['dromos-panel dromos-screen-header', back ? 'has-back' : null, aside ? 'has-aside' : null].filter(Boolean).join(' ');
	return (
		<header className={classes}>
			{back ? (
				<button type="button" className="dromos-screen-back" aria-label={back.ariaLabel} onClick={back.onBack}>
					<span aria-hidden="true">←</span>
					{back.label}
				</button>
			) : null}
			<h2 className="dromos-screen-title" tabIndex={-1} data-screen-heading>
				{title}
			</h2>
			{aside ?? null}
		</header>
	);
}
