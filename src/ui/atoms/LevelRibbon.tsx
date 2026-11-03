export interface LevelRibbonProps {
	/** "New level". */
	readonly kicker: string;
	/** "Level 4". */
	readonly title: string;
}

/**
 * The ribbon that unfurls over the scene at a character level-up (game-ui S4), drawn after the
 * design: a banner with two tails. It is a drawing: the ceremony panel says the same in words.
 */
export function LevelRibbon({ kicker, title }: LevelRibbonProps) {
	return (
		<div className="dromos-ribbon" aria-hidden="true">
			<svg className="dromos-ribbon-cloth" viewBox="0 0 270 58" focusable="false">
				<path className="dromos-ribbon-tail" d="M0 12h32v34H0l10-17z" />
				<path className="dromos-ribbon-tail" d="M270 12h-32v34h32l-10-17z" />
				<path className="dromos-ribbon-band" d="M22 4h226v36H22z" />
			</svg>
			<span className="dromos-ribbon-text">
				<span className="dromos-ribbon-kicker">{kicker}</span>
				<span className="dromos-ribbon-title">{title}</span>
			</span>
		</div>
	);
}
