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

export interface ScreenHeaderProps {
	readonly title: string;
	/** `null` while there is no character to name (loading, missing or unreadable). */
	readonly character: ScreenHeaderCharacter | null;
}

/**
 * The header card that opens every screen other than home (S1): the screen's name, which takes
 * the focus when the screen opens, and "<name> · <title> · level N · X / Y XP" on the right.
 */
export function ScreenHeader({ title, character }: ScreenHeaderProps) {
	const t = useT();
	const line = character ? [character.name, character.title, t('screen.level', { level: character.level }), character.xpText].filter((part) => part !== null).join(' · ') : null;
	return (
		<header className="dromos-panel dromos-screen-header">
			<h2 className="dromos-screen-title" tabIndex={-1} data-screen-heading>
				{title}
			</h2>
			{line ? <p className="dromos-screen-character">{line}</p> : null}
		</header>
	);
}
