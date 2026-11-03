/**
 * The band above the scene while Habitica cannot be reached (S10): an oil lamp and "Last known
 * state · N ago". It is no live region: its time changes every minute, and the sync line
 * already announces the status once.
 */
export function OfflineBand({ text }: { readonly text: string }) {
	return (
		<div className="dromos-band">
			<svg className="dromos-band-lamp" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
				<path d="M5 14c0-3 3-5 7-5s7 2 7 5-3 5-7 5-7-2-7-5zM12 9V6M10 6h4M5 13.5H2.5M19 12l3-1.5" />
			</svg>
			<span>{text}</span>
		</div>
	);
}
