/*
 * The market behind the stall (M10 S6), seen between its two posts: the sky of the hour with the
 * sun, or the moon and the stars, two drifting clouds, a far ridge and the hills, a small temple on
 * its steps, cypresses, the flat-roofed houses of the town with their windows lit at night, a date
 * palm, and in the street another stall under its own awning. Every fill is a `--dromos-scene-*`
 * token, so the theme and the time of day repaint it as they repaint the landscape.
 */

/** The cloud of the landscape, drawn at its place and drifting slowly. */
function Cloud({ x, y, slow = false }: { readonly x: number; readonly y: number; readonly slow?: boolean }) {
	return (
		<g transform={`translate(${x} ${y})`}>
			<g className={slow ? 'dromos-stall-drift dromos-scene-life is-slow' : 'dromos-stall-drift dromos-scene-life'}>
				<path className="dromos-stall-cloud" d="M0 22c-10 0-14-12-5-17 1-10 15-12 20-4 7-6 20-1 19 9 8 1 9 12-1 12z" />
			</g>
		</g>
	);
}

export function Market() {
	return (
		<g className="dromos-stall-market">
			<g className="dromos-stall-stars dromos-scene-life">
				<circle cx="292" cy="74" r="1.3" />
				<circle cx="372" cy="52" r="1.1" />
				<circle cx="446" cy="86" r="1" />
				<circle cx="560" cy="104" r="1.4" />
				<circle cx="602" cy="132" r="1" />
				<circle cx="712" cy="70" r="1.2" />
				<circle cx="742" cy="122" r="1" />
			</g>
			<g className="dromos-stall-sun-height">
				<circle className="dromos-stall-sun" cx="626" cy="100" r="16" />
			</g>
			<Cloud x={372} y={70} />
			<Cloud x={540} y={66} slow />
			<path className="dromos-stall-ridge" d="M236 172C300 160 360 164 420 170S540 156 620 166 720 160 764 166V240H236z" />
			<path className="dromos-stall-hill is-far" d="M236 198C320 186 420 192 500 194S660 182 764 190V240H236z" />
			{/* The temple on the hill above the town, on its steps. */}
			<g className="dromos-stall-house">
				<rect x="612" y="182" width="80" height="6" />
				<rect x="620" y="158" width="5" height="24" />
				<rect x="635" y="158" width="5" height="24" />
				<rect x="650" y="158" width="5" height="24" />
				<rect x="665" y="158" width="5" height="24" />
				<rect x="680" y="158" width="5" height="24" />
				<rect x="615" y="153" width="75" height="6" />
				<path d="M615 153L652.5 139 690 153z" />
			</g>
			<g className="dromos-stall-house">
				<rect x="572" y="196" width="32" height="26" />
				<rect x="600" y="186" width="40" height="36" />
				<rect x="636" y="200" width="28" height="22" />
				<rect x="660" y="190" width="34" height="32" />
				<rect x="690" y="204" width="26" height="18" />
				<path className="dromos-stall-door" d="M614 222V211H623V222" />
			</g>
			<g className="dromos-stall-windows">
				<rect x="580" y="203" width="4" height="5" />
				<rect x="610" y="194" width="5" height="5" />
				<rect x="627" y="194" width="5" height="5" />
				<rect x="645" y="207" width="4" height="4" />
				<rect x="670" y="198" width="5" height="5" />
				<rect x="699" y="210" width="4" height="4" />
			</g>
			<path className="dromos-stall-leaf" d="M730 214C722 200 724 176 730 156 736 176 738 200 730 214zM744 216C738 205 740 188 744 174 748 188 750 205 744 216z" />
			{/* A date palm by the left post. */}
			<path className="dromos-stall-trunk" d="M268 236C270 214 264 192 272 168" />
			<path
				className="dromos-stall-leaf"
				d="M272 168C260 160 246 162 238 172 250 166 262 166 272 168zM272 168C264 154 252 150 242 152 254 156 264 160 272 168zM272 168C274 154 282 146 292 146 284 152 278 158 272 168zM272 168C282 161 292 162 298 168 290 165 281 165 272 168zM272 168C268 156 270 146 276 140 274 150 274 158 272 168z"
			/>
			<g className="dromos-stall-dates">
				<circle cx="268" cy="173" r="2.2" />
				<circle cx="272.5" cy="175" r="2.2" />
				<circle cx="276.5" cy="172.5" r="2" />
			</g>
			<path className="dromos-stall-hill" d="M236 214C340 206 460 212 560 210S700 206 764 210V240H236z" />
			<path className="dromos-stall-street" d="M236 224H764V240H236z" />
			{/* Another stall down the street, under its own awning. */}
			<g className="dromos-stall-far">
				<path className="dromos-stall-pole" d="M720 224V200M754 224V200" />
				<rect className="dromos-stall-linen" x="714" y="193" width="12" height="8" />
				<rect className="dromos-stall-dyed" x="726" y="193" width="12" height="8" />
				<rect className="dromos-stall-linen" x="738" y="193" width="12" height="8" />
				<rect className="dromos-stall-dyed" x="750" y="193" width="10" height="8" />
				<rect className="dromos-stall-wood" x="716" y="213" width="42" height="7" />
				<circle className="dromos-stall-clay" cx="726" cy="209.5" r="3.5" />
				<circle className="dromos-stall-basket" cx="746" cy="210" r="3.2" />
			</g>
		</g>
	);
}
