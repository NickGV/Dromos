/**
 * The merchant behind his counter (M10 S6), facing whoever comes to the stall, drawn from the waist
 * up with his waist at the origin, on the counter's line: a cream tunic with the two dyed stripes of
 * the era (clavi), a mantle of woad blue over both shoulders and down to the elbows, a sash, a head
 * cloth falling to his shoulders and held by a cord, a full beard and a face hint, eyes, brows, a
 * nose and a smile in the beard. One forearm rests on the counter; the other hand is held out, palm up, in welcome. He
 * breathes, and now and then lifts the open hand a little and nods; the stylesheet holds it all still
 * under reduced motion, offline and out of sight.
 */
export function Merchant({ x, y, scale }: { readonly x: number; readonly y: number; readonly scale: number }) {
	return (
		<g className="dromos-stall-merchant" transform={`translate(${x} ${y}) scale(${scale})`}>
			<g className="dromos-stall-breath dromos-scene-life">
				<path className="dromos-stall-cloth" d="M-14-106C-20-96-25-84-30-70H30C25-84 20-96 14-106z" />
				<path className="dromos-stall-tunic" d="M-36-70C-22-76 22-76 36-70L42 6H-42z" />
				<path className="dromos-stall-clavus" d="M-18-73.6H-14.2V6H-18zM14.2-73.6H18V6H14.2z" />
				<path className="dromos-stall-fold" d="M-9-74L0-61 9-74" />
				<path className="dromos-stall-mantle" d="M-36-70C-46-66-50-46-52 6H-33C-31-26-29-50-23-72-28-72-32-71-36-70z" />
				<path className="dromos-stall-mantle" d="M36-70C46-66 50-46 52 6H33C31-26 29-50 23-72 28-72 32-71 36-70z" />
				<path className="dromos-stall-fold" d="M-44-42C-42-30-41-16-41-2M44-42C42-30 41-16 41-2" />
				<path className="dromos-stall-sash" d="M-33-18C-12-15 12-15 33-18" />
				{/* The arm at rest, under the mantle to the elbow, its forearm along the counter and the hand flat on it. */}
				<path className="dromos-stall-mantle" d="M36-68C48-62 56-46 58-24L46-20C44-36 40-50 31-60z" />
				<path className="dromos-stall-tunic" d="M58-24L40-13 41-4.5 58-9z" />
				<path className="dromos-stall-skin" d="M40-13L30-10.5 30.5-3.5 41-4.5z" />
				<path className="dromos-stall-skin" d="M30-10.5C24-10.5 18-8.5 16.5-5.5 18.5-3.4 24-3.2 30.5-3.5z" />
				<path className="dromos-stall-fold" d="M19.5-6.4H24.5" />
				{/* The arm held out in welcome: the forearm, in its sleeve, and the open hand turn about the elbow. */}
				<path className="dromos-stall-mantle" d="M-36-68C-48-62-56-48-60-34L-48-28C-46-42-41-52-32-60z" />
				<g className="dromos-stall-welcome">
					<path className="dromos-stall-tunic" d="M-60-37C-64-38-68-38.5-72-39L-72.5-28C-66-27.5-58-26.5-50-26.5-52-30-56-34-60-37z" />
					<path className="dromos-stall-skin" d="M-72-38.6L-84-38.6-84.5-29.2-72.5-28.4z" />
					<path className="dromos-stall-skin" d="M-84-38.6C-92-40.6-100-39-104-34-102-30.5-94-29.5-86-29.5L-84.5-29.2z" />
					<path className="dromos-stall-skin" d="M-86-38.4C-87-44-91-46-94-43-93-40.5-90-39.4-87-38z" />
					<path className="dromos-stall-fold" d="M-96-37.6L-102-35M-91-38.8L-98-37.2" />
				</g>
				<g className="dromos-stall-nod">
					<ellipse className="dromos-stall-skin" cx="0" cy="-96" rx="12" ry="14" />
					<path className="dromos-stall-beard" d="M-12-95C-13-84-9-74 0-71 9-74 13-84 12-95 10-90 6-88 0-88S-10-90-12-95z" />
					<path className="dromos-stall-moustache" d="M-5.5-88.6C-2-90.6 2-90.6 5.5-88.6" />
					<path className="dromos-stall-smile" d="M-2.6-85.6C-1-84.6 1-84.6 2.6-85.6" />
					<path className="dromos-stall-cloth" d="M-15-98C-17-114-9-122 0-122S17-114 15-98L20-74C14-73 12-78 12-86 12-95 8-103 0-103S-12-95-12-86C-12-78-14-73-20-74z" />
					<path className="dromos-stall-cord" d="M-13.4-104C-5-108.2 5-108.2 13.4-104" />
					<circle className="dromos-stall-eye" cx="-4.6" cy="-96.4" r="1.25" />
					<circle className="dromos-stall-eye" cx="4.6" cy="-96.4" r="1.25" />
					<path className="dromos-stall-brow" d="M-7.6-100.4L-2.6-101.2M2.6-101.2L7.6-100.4" />
					<path className="dromos-stall-fold" d="M0-97V-91.6L1.6-91" />
				</g>
			</g>
		</g>
	);
}
