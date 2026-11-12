/**
 * The wise man of the character's plaque (M11 S1), facing whoever looks, as a painted panel portrait
 * of the era, in a 100-unit box with his shoulders at the bottom: a high bald brow, white hair at the
 * temples, kind eyes and a smile in a long white beard, a sienna himation over the left shoulder of
 * a cream tunic, and a scroll in his hand. He is the same for everyone and names nobody.
 */
export function Sage() {
	return (
		<g className="dromos-portrait-sage">
			<path className="dromos-portrait-tunic" d="M10 104C11 88 20 77.6 35 72.4L50 70.4L65 72.4C80 77.6 89 88 90 104Z" />
			<path className="dromos-portrait-fold" d="M38.4 74.6C36 82 34.6 92 34.4 104" />
			<path className="dromos-portrait-himation" d="M65 72.4C80 77.6 89 88 90 104H34C44 96.4 53 88 58.6 79.2C60.6 76 62.6 73.6 65 72.4Z" />
			<path className="dromos-portrait-fold" d="M70.6 76.6C64 86 56 95 46.6 104M78.6 82C73 90.4 67.6 97.4 61 104M84.4 90C81 95 78 99.4 74.4 104" />
			<path className="dromos-portrait-skin" d="M36.6 40C36.6 28.4 42.4 21.4 50 21.4S63.4 28.4 63.4 40C63.4 50 58 59 50 59S36.6 50 36.6 40Z" />
			<path className="dromos-portrait-white" d="M37.6 34.2C33.6 35.4 31.4 39.6 31.8 44.4C32.2 48.6 34.4 51.8 37.6 53.2L39.4 45.6C38.2 42 37.8 38 37.6 34.2Z" />
			<path className="dromos-portrait-white" d="M62.4 34.2C66.4 35.4 68.6 39.6 68.2 44.4C67.8 48.6 65.6 51.8 62.4 53.2L60.6 45.6C61.8 42 62.2 38 62.4 34.2Z" />
			<path className="dromos-portrait-lock" d="M34.4 40.2C34.6 44 35.6 47.2 37.4 49.6M65.6 40.2C65.4 44 64.4 47.2 62.6 49.6" />
			<path className="dromos-portrait-crease" d="M44.2 27.6Q50 26 55.8 27.6M45.4 30.6Q50 29.4 54.6 30.6" />
			<circle className="dromos-portrait-cheek" cx="42.4" cy="45.4" r="3" />
			<circle className="dromos-portrait-cheek" cx="57.6" cy="45.4" r="3" />
			<path className="dromos-portrait-white" d="M37.6 45C37 53 38 61 41 68.6C43.6 75 46.6 80.6 50 86.6C53.4 80.6 56.4 75 59 68.6C62 61 63 53 62.4 45C60.2 50 56 52.6 50 52.8C44 52.6 39.8 50 37.6 45Z" />
			<path className="dromos-portrait-lock" d="M44.2 57C44.6 65 46.2 73 48.4 80M55.8 57C55.4 65 53.8 73 51.6 80M50 55.6V84" />
			<path className="dromos-portrait-white" d="M50 47.4C46.4 46.4 42.6 47.8 40.6 51.4C43.6 50.8 46.8 50.4 50 50.6C53.2 50.4 56.4 50.8 59.4 51.4C57.4 47.8 53.6 46.4 50 47.4Z" />
			<path className="dromos-portrait-smile" d="M47.6 53.2Q50 54.6 52.4 53.2" />
			<path className="dromos-portrait-white" d="M40.4 36.6C42.4 34.4 45.4 34.2 47.6 35.6C45.4 36 43 36.6 40.6 37.8Z" />
			<path className="dromos-portrait-white" d="M59.6 36.6C57.6 34.4 54.6 34.2 52.4 35.6C54.6 36 57 36.6 59.4 37.8Z" />
			<path className="dromos-portrait-lid" d="M42.2 39.4Q44.2 38.2 46.2 39.4M53.8 39.4Q55.8 38.2 57.8 39.4" />
			<circle className="dromos-portrait-eye" cx="44.2" cy="40.2" r="1.25" />
			<circle className="dromos-portrait-eye" cx="55.8" cy="40.2" r="1.25" />
			<path className="dromos-portrait-crease" d="M41 42.4L40 43.4M59 42.4L60 43.4" />
			<path className="dromos-portrait-fold" d="M50 39.6V46.2L51.8 46.8" />
			{/* The scroll, held across the chest in his right hand. */}
			<g transform="translate(3 -7) rotate(-38 27 92)">
				<rect className="dromos-portrait-scroll" x="9" y="88.2" width="36" height="7.6" rx="1.4" />
				<ellipse className="dromos-portrait-scroll" cx="45" cy="92" rx="1.8" ry="3.8" />
				<path className="dromos-portrait-fold" d="M15 88.2V95.8M39 88.2V95.8" />
				<path className="dromos-portrait-skin" d="M22.4 86.6C22.4 84.6 24.6 83.2 27.4 83.2C30.2 83.2 32.4 84.6 32.4 86.6V97.4C32.4 99.4 30.2 100.8 27.4 100.8C24.6 100.8 22.4 99.4 22.4 97.4Z" />
				<path className="dromos-portrait-fold" d="M22.4 91.4H27M22.4 94.6H27" />
			</g>
		</g>
	);
}
