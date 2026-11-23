/** The design's send icon. */
const SEND = 'M4 12l16-8-6 16-3-7z';

export interface SendButtonProps {
	/** True while the task or habit is on its way: the button stays focusable but ignores clicks. */
	readonly sending: boolean;
	/** True while something else runs on the row, such as linking it (link-existing-todo S3): no spinner, no clicks. */
	readonly disabled?: boolean;
	readonly onSend: () => void;
	/** "Send to Habitica". */
	readonly label: string;
	/** "Sending…". */
	readonly sendingLabel: string;
}

/**
 * "Send to Habitica" on a campaign task or habit. While it sends it is `aria-disabled`, not
 * `disabled`, so the keyboard focus stays on it, and a spinner replaces the icon.
 */
export function SendButton({ sending, disabled = false, onSend, label, sendingLabel }: SendButtonProps) {
	const idle = !sending && !disabled;
	return (
		<button type="button" className="dromos-send-button" aria-disabled={!idle} aria-busy={sending} onClick={idle ? onSend : undefined}>
			{sending ? (
				<>
					<span className="dromos-spinner" aria-hidden="true" />
					{sendingLabel}
				</>
			) : (
				<>
					<svg className="dromos-send-icon" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" focusable="false">
						<path d={SEND} />
					</svg>
					{label}
				</>
			)}
		</button>
	);
}
