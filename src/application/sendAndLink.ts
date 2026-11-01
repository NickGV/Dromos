import { TaskSourceError, type LinkResult, type TaskSourceErrorKind } from '../ports';

export type LinkOutcome =
	| { readonly kind: 'linked'; readonly habiticaId: string }
	/** The task already has a Habitica id: nothing was created. */
	| { readonly kind: 'already-linked' }
	| { readonly kind: 'not-found' }
	| { readonly kind: 'not-a-project' }
	| { readonly kind: 'habitica-failed'; readonly error: TaskSourceErrorKind }
	/** The task exists in Habitica but its id could not be written into the note. */
	| { readonly kind: 'write-failed'; readonly habiticaId: string }
	/** The note was linked meanwhile, so the task just created is a duplicate the user has to delete. */
	| { readonly kind: 'duplicate'; readonly habiticaId: string };

/**
 * Creates a task in Habitica and writes its id into the note: the part "Enviar a Habitica"
 * shares between a task and a habit. If creating fails nothing is written; if writing fails
 * the id is returned so it reaches the user. Never rejects.
 */
export async function sendAndLink(create: () => Promise<string>, link: (habiticaId: string) => Promise<LinkResult>): Promise<LinkOutcome> {
	let habiticaId: string;
	try {
		habiticaId = await create();
	} catch (error) {
		return { kind: 'habitica-failed', error: error instanceof TaskSourceError ? error.kind : 'Unknown' };
	}

	try {
		const result = await link(habiticaId);
		if (result === 'linked') return { kind: 'linked', habiticaId };
		if (result === 'already-linked') return { kind: 'duplicate', habiticaId };
	} catch {
		// Fall through: the task exists, so the id must reach the user.
	}
	return { kind: 'write-failed', habiticaId };
}
