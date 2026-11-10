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
}

/**
 * The header card that opens every screen other than home (S1): the screen's name, which takes
 * the focus when the screen opens. Inside a screen (a shelf of the library) a back link sits above
 * the title. The character is on the plaque under the scene now (S2), so the card no longer names it.
 */
export function ScreenHeader({ title, back }: ScreenHeaderProps) {
	return (
		<header className={back ? 'dromos-panel dromos-screen-header has-back' : 'dromos-panel dromos-screen-header'}>
			{back ? (
				<button type="button" className="dromos-screen-back" aria-label={back.ariaLabel} onClick={back.onBack}>
					<span aria-hidden="true">←</span>
					{back.label}
				</button>
			) : null}
			<h2 className="dromos-screen-title" tabIndex={-1} data-screen-heading>
				{title}
			</h2>
		</header>
	);
}
