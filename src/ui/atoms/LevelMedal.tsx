export interface LevelMedalProps {
	readonly level: number;
	/** "Level 3": the medallion is one image for screen readers. */
	readonly label: string;
	/** Ochre, from the second step of the level-up ceremony on (game-ui S4). */
	readonly lit: boolean;
}

/** The character's level as a 72 px medallion with its number (game-ui S3). */
export function LevelMedal({ level, label, lit }: LevelMedalProps) {
	return (
		<span className={lit ? 'dromos-level-medal is-lit' : 'dromos-level-medal'} role="img" aria-label={label}>
			<svg className="dromos-level-medal-disc" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
				<circle className="dromos-level-medal-face" cx="36" cy="36" r="32" />
				<circle className="dromos-level-medal-rim" cx="36" cy="36" r="26" />
			</svg>
			<span className="dromos-level-medal-number">{level}</span>
		</span>
	);
}
