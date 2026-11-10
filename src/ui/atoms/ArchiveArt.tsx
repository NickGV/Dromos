/**
 * The archive's room (M8 S5, 08-Visual-Design "El archivo"): an arched window with the landscape,
 * the hills, a cypress and a cloud by day, the moon and a few stars at night; a band of afternoon
 * light from it by day; and the long worktable under it, with a wax tablet and its stylus, loose
 * sheets, a folded letter, tied tablets and, at night, a candle. The stylesheet draws the table's
 * plank and decides what shows at each hour; every color comes from a token.
 */
export function ArchiveRoomArt() {
	return (
		<>
			<svg className="dromos-archive-window" viewBox="0 0 150 128" aria-hidden="true" focusable="false">
				<path className="dromos-archive-sky" d="M10 124V56A65 46 0 0 1 140 56V124Z" />
				<circle className="dromos-archive-moon" cx="104" cy="42" r="8" />
				<path className="dromos-archive-star" d="M40 36H40.01M58 26H58.01M122 66H122.01" />
				<path className="dromos-archive-cloud" d="M36 59A4 4 0 0 1 35 51.5A6 6 0 0 1 45.5 48.5A5 5 0 0 1 54.5 51A4 4 0 0 1 54 59Z" />
				<path className="dromos-archive-hill is-far" d="M10 92C36 82 62 86 88 83S128 84 140 87V124H10Z" />
				<path className="dromos-archive-hill" d="M10 106C46 98 86 110 140 100V124H10Z" />
				<path className="dromos-archive-cypress" d="M98 103C93 97 93 81 98 71C103 81 103 97 98 103Z" />
				<path className="dromos-archive-mullion" d="M75 11V124M10 82H140" />
				<path className="dromos-archive-frame" d="M10 124V56A65 46 0 0 1 140 56V124Z" />
				<rect className="dromos-archive-sill" x="4" y="122" width="142" height="6" rx="1" />
			</svg>
			<span className="dromos-archive-light" />
			<div className="dromos-archive-table">
				<svg className="dromos-archive-things" viewBox="0 0 420 60" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
					<rect className="dromos-resource-wood" x="30" y="32" width="40" height="26" rx="2" />
					<rect className="dromos-resource-wax" x="35" y="37" width="30" height="16" />
					<path className="dromos-resource-stylus" d="M60 50L80 18" />
					<path className="dromos-resource-paper" d="M100 51L146 45L148 57L102 59Z" />
					<rect className="dromos-resource-paper" x="160" y="36" width="40" height="22" rx="1.5" />
					<path className="dromos-resource-line" d="M160.5 37L180 49L199.5 37" />
					<rect className="dromos-resource-wood" x="220" y="34" width="36" height="8" rx="1.5" />
					<rect className="dromos-resource-wood" x="220" y="42" width="36" height="8" rx="1.5" />
					<rect className="dromos-resource-wood" x="220" y="50" width="36" height="8" rx="1.5" />
					<rect className="dromos-resource-cord" x="236" y="32" width="4" height="27" />
					<path className="dromos-resource-paper" d="M280 53L330 50L331 58H280Z" />
					<rect className="dromos-resource-wood" x="340" y="38" width="30" height="20" rx="2" />
					<rect className="dromos-resource-wax" x="344" y="42" width="22" height="12" />
					<path className="dromos-resource-stylus" d="M362 54L378 30" />
					<g className="dromos-archive-candle">
						<ellipse className="dromos-library-lamp-halo" cx="400" cy="30" rx="10" ry="9" />
						<path className="dromos-library-lamp-flame" d="M400 37C397 34 397.5 30 400 26C402.5 30 403 34 400 37Z" />
						<rect className="dromos-archive-candle-body" x="395" y="38" width="10" height="20" rx="1" />
					</g>
				</svg>
			</div>
		</>
	);
}

/**
 * The doorway to the archive in the reading room's wall (M8 S2): an arch of dressed stone opening on
 * the dark room, with the rack of pigeonholes and the edge of the worktable seen through it.
 */
export function ArchiveDoorArt() {
	return (
		<svg className="dromos-archive-door-art" viewBox="0 0 96 112" aria-hidden="true" focusable="false">
			<path className="dromos-alcove-joints" d="M2 20H9M3 50H9M2 84H9M87 30H94M87 62H93M87 96H94" />
			<path className="dromos-archive-door-opening" d="M18 108V50A30 30 0 0 1 78 50V108Z" />
			<rect className="dromos-resource-wood" x="31" y="42" width="34" height="28" rx="1" />
			<path className="dromos-resource-line" d="M31 51.5H65M31 61H65M42.3 42V70M53.7 42V70" />
			<rect className="dromos-resource-paper" x="33.5" y="45" width="6" height="4" />
			<rect className="dromos-resource-paper" x="56" y="54.5" width="6" height="4" />
			<rect className="dromos-alcove-plank" x="22" y="84" width="52" height="5" rx="1" />
			<path className="dromos-archive-door-jamb" d="M15 108V50A33 33 0 0 1 81 50V108" />
			<rect className="dromos-archive-door-step" x="8" y="106" width="80" height="5" rx="1" />
		</svg>
	);
}

/** The rack of pigeonholes, the drawing of "Todos": a wooden frame of six cells, a sheet in some. */
export function ArchiveRackArt() {
	return (
		<svg className="dromos-resource-art is-all" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
			<rect className="dromos-resource-wood" x="5" y="8" width="30" height="24" rx="1" />
			<rect className="dromos-resource-paper" x="7.5" y="12" width="6" height="4" />
			<rect className="dromos-resource-paper" x="27" y="12" width="6" height="4" />
			<rect className="dromos-resource-paper" x="17" y="24" width="6" height="4" />
			<path className="dromos-resource-line" d="M5 20H35M15 8V32M25 8V32" />
		</svg>
	);
}
