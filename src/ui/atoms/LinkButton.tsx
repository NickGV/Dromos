export interface LinkButtonProps {
	/** True while this task is being linked: a spinner and "Linking…". */
	readonly busy: boolean;
	/** True while anything runs on the row: the button stays focusable but ignores clicks. */
	readonly disabled: boolean;
	readonly onLink: () => void;
	/** "Link existing". */
	readonly label: string;
	/** "Linking…". */
	readonly busyLabel: string;
}

/**
 * "Link existing" on a campaign task (link-existing-todo S3): the quieter action beside "Send to
 * Habitica". Like it, it is `aria-disabled`, not `disabled`, so the keyboard focus stays on it.
 */
export function LinkButton({ busy, disabled, onLink, label, busyLabel }: LinkButtonProps) {
	return (
		<button type="button" className="dromos-link-button" aria-disabled={disabled} aria-busy={busy} onClick={disabled ? undefined : onLink}>
			{busy ? (
				<>
					<span className="dromos-spinner" aria-hidden="true" />
					{busyLabel}
				</>
			) : (
				label
			)}
		</button>
	);
}
