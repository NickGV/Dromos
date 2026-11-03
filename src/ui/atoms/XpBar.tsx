import { useT } from '../i18n';

export interface XpBarProps {
	/** XP earned inside the current level. */
	readonly current: number;
	/** XP the current level needs. */
	readonly total: number;
	/** Fill width, 0..100. */
	readonly percent: number;
	readonly text: string;
	/**
	 * A line on the right under the bar, such as "Level 4 in 280 XP". With it the bar is the
	 * character card's: hatched, with its numbers under it instead of beside it (game-ui S3).
	 */
	readonly note?: string;
	/**
	 * A drawn width other than `percent`: while the level-up ceremony fills the bar, or while it
	 * waits at the value last seen (game-ui S15). Screen readers keep the real values.
	 */
	readonly fill?: number;
	/** The fill moves to its width slowly, as the walker walks (game-ui S15); the card's bar only. */
	readonly catchUp?: boolean;
}

/** Progress through the current level, with the numbers next to the bar, or under it with a note. */
export function XpBar({ current, total, percent, text, note, fill, catchUp = false }: XpBarProps) {
	const t = useT();
	const track = (
		<div
			className="dromos-xp-track"
			role="progressbar"
			aria-label={t('character.xp.aria')}
			aria-valuemin={0}
			aria-valuemax={total}
			aria-valuenow={current}
			aria-valuetext={text}
		>
			<div className="dromos-xp-fill" style={{ width: `${fill ?? percent}%` }} />
		</div>
	);
	if (note === undefined) {
		return (
			<div className="dromos-xp">
				{track}
				<span className="dromos-xp-text">{text}</span>
			</div>
		);
	}
	return (
		<div className={`dromos-xp is-stacked${catchUp ? ' is-catching-up' : ''}`}>
			{track}
			<div className="dromos-xp-caption">
				<span className="dromos-xp-text">{text}</span>
				<span className="dromos-xp-next">{note}</span>
			</div>
		</div>
	);
}
