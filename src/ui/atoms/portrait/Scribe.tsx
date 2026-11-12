/**
 * Esdras in his letter (M11 S2), facing whoever reads it, in a 100-unit box with his shoulders at the
 * bottom: a scribe, never the wise man of the plaque. A linen shawl with indigo stripes over his head
 * frames his face; dark brows, a short dark beard going grey, an indigo robe, and his reed pen raised
 * in his hand.
 */
export function Scribe() {
	return (
		<g className="dromos-portrait-scribe">
			<path className="dromos-portrait-robe" d="M10 104C11 88 20 77.6 35 72.4L50 70.4L65 72.4C80 77.6 89 88 90 104Z" />
			<path className="dromos-portrait-skin" d="M38 41C38 30.6 43.4 24.6 50 24.6S62 30.6 62 41C62 50.4 57 58 50 58S38 50.4 38 41Z" />
			<path
				className="dromos-portrait-shawl"
				d="M50 17.6C38.6 17.6 31.4 25.6 31 37.4C30.6 50 29.4 62 25 74L16 104H37.4C38.4 92 39 80 39.4 68C39.8 58 38.6 48 38.4 39.6C38.2 33.4 42.6 29.4 50 29.4S61.8 33.4 61.6 39.6C61.4 48 60.2 58 60.6 68C61 80 61.6 92 62.6 104H84L75 74C70.6 62 69.4 50 69 37.4C68.6 25.6 61.4 17.6 50 17.6Z"
			/>
			<path className="dromos-portrait-stripe" d="M35.4 40C35.2 50 34.6 60 32.4 70C30.6 78 28.6 86 26.8 94M64.6 40C64.8 50 65.4 60 67.6 70C69.4 78 71.4 86 73.2 94" />
			<path className="dromos-portrait-stripe" d="M33.6 27.6Q50 18.2 66.4 27.6" />
			<path className="dromos-portrait-fold" d="M38.8 22.4Q50 17.6 61.2 22.4" />
			<path className="dromos-portrait-beard" d="M39 45.6C38.6 52 39.6 58.6 42.6 63.6C44.6 67 47.2 68.8 50 68.8S55.4 67 57.4 63.6C60.4 58.6 61.4 52 61 45.6C59 49.4 55.4 50.6 50 50.6S41 49.4 39 45.6Z" />
			<path className="dromos-portrait-grey" d="M40.6 50.4C40.8 54.4 41.8 57.8 43.4 60.6M59.4 50.4C59.2 54.4 58.2 57.8 56.6 60.6" />
			<path className="dromos-portrait-beard" d="M50 47.6C46.6 46.6 43.4 47.8 41.6 51C44.4 50.6 47.2 50.4 50 50.6C52.8 50.4 55.6 50.6 58.4 51C56.6 47.8 53.4 46.6 50 47.6Z" />
			<path className="dromos-portrait-brow" d="M42.4 37.4Q44.8 35.8 47.2 37M52.8 37Q55.2 35.8 57.6 37.4" />
			<circle className="dromos-portrait-eye" cx="44.8" cy="40.4" r="1.2" />
			<circle className="dromos-portrait-eye" cx="55.2" cy="40.4" r="1.2" />
			<path className="dromos-portrait-fold" d="M50 39.8V46L51.6 46.6" />
			{/* The arm raised in its sleeve, the reed pen and the hand that holds it. */}
			<path className="dromos-portrait-robe" d="M42 104C40 96 36.4 90.4 32 87.2L24 90C26.2 94.6 28 99 29 104Z" />
			<path className="dromos-portrait-reed" d="M29.6 90L13.6 62" />
			<path className="dromos-portrait-nib" d="M13.6 62L12 59.2" />
			<path className="dromos-portrait-skin" d="M33.4 88.4C33.4 84.6 30.8 82.2 27.8 82.2C25 82.2 23.2 84.2 23.6 86.8C24 89.4 26.2 91 28.8 91C31.4 91 33.4 90.4 33.4 88.4Z" />
			<path className="dromos-portrait-fold" d="M29 85C27.6 84.4 26 84.6 25 85.6" />
		</g>
	);
}
