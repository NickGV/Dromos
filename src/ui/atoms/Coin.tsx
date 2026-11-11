/**
 * A gold coin (M10 S4): a struck disc with a rim and, at its centre, the Dromos road's waymark, a
 * small lozenge. A drawing beside an amount, which always says itself in words for screen readers.
 */
export function Coin({ size = 16 }: { readonly size?: number }) {
	return (
		<svg className="dromos-coin" viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false">
			<circle className="dromos-coin-face" cx="10" cy="10" r="8.6" />
			<circle className="dromos-coin-rim" cx="10" cy="10" r="6.2" />
			<path className="dromos-coin-mark" d="M10 6.6 12.6 10 10 13.4 7.4 10z" />
		</svg>
	);
}
