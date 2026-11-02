/** The system clipboard. Rejects when the system refuses. */
export interface Clipboard {
	copy(text: string): Promise<void>;
}
