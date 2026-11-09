import { useT } from '../i18n';

/** The character as the header card names it. */
export interface ScreenHeaderCharacter {
	readonly name: string;
	/** `null` when the note has no title. */
	readonly title: string | null;
	readonly level: number;
	/** "240 / 520 XP". */
	readonly xpText: string;
}

/** A way back to the screen above, "← Biblioteca" (M7 S5). */
export interface ScreenHeaderBack {
	readonly label: string;
	/** Its accessible name, which holds the label: "Volver a la biblioteca". */
	readonly ariaLabel: string;
	readonly onBack: () => void;
}

export interface ScreenHeaderProps {
	readonly title: string;
	/** `null` while there is no character to name (loading, missing or unreadable). */
	readonly character: ScreenHeaderCharacter | null;
	/** Given inside a screen, as on a shelf of the library: the back link above the title. */
	readonly back?: ScreenHeaderBack;
}

/**
 * The header card that opens every screen other than home (S1): the screen's name, which takes
 * the focus when the screen opens, and "<name> · <title> · level N · X / Y XP" on the right.
 * Inside a screen (a shelf of the library) a back link sits above the title.
 */
export function ScreenHeader({ title, character, back }: ScreenHeaderProps) {
	const t = useT();
	const line = character ? [character.name, character.title, t('screen.level', { level: character.level }), character.xpText].filter((part) => part !== null).join(' · ') : null;
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
			{line ? <p className="dromos-screen-character">{line}</p> : null}
		</header>
	);
}
