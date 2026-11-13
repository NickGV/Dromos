import { TaskSourceError, type LinkResult, type RelinkResult, type TaskSourceErrorKind } from '../ports';

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
	| { readonly kind: 'duplicate'; readonly habiticaId: string }
	/**
	 * "Enviar de nuevo" (ADR-021): the note, or Habitica's answer, no longer says the task was
	 * deleted, so its id was not replaced. `habiticaId` is `null` when nothing was created, and the
	 * id of the new task, a copy the user has to delete, when the note changed while it was created.
	 */
	| { readonly kind: 'changed'; readonly habiticaId: string | null };

/**
 * Creates a task in Habitica and writes its id into the note: the part "Enviar a Habitica"
 * shares between a task and a habit. If creating fails nothing is written; if writing fails
 * the id is returned so it reaches the user. Never rejects.
 */
export function sendAndLink(create: () => Promise<string>, link: (habiticaId: string) => Promise<LinkResult>): Promise<LinkOutcome> {
	return createThenWrite(create, async (habiticaId) => {
		const result = await link(habiticaId);
		if (result === 'linked') return { kind: 'linked', habiticaId };
		if (result === 'already-linked') return { kind: 'duplicate', habiticaId };
		return null;
	});
}

/**
 * "Enviar de nuevo" (ADR-021): creates the task again and replaces its old id through `relink`,
 * a compare-and-swap. If creating fails nothing is written; if the note no longer holds the old id
 * the new one is returned as `changed`, and if writing fails as `write-failed`. Never rejects.
 */
export function sendAndRelink(create: () => Promise<string>, relink: (habiticaId: string) => Promise<RelinkResult>): Promise<LinkOutcome> {
	return createThenWrite(create, async (habiticaId) => ((await relink(habiticaId)) === 'relinked' ? { kind: 'linked', habiticaId } : { kind: 'changed', habiticaId }));
}

/** Creates, then writes: `write` answers the outcome, or `null` (or a rejection) for an id that could not be written. */
async function createThenWrite(create: () => Promise<string>, write: (habiticaId: string) => Promise<LinkOutcome | null>): Promise<LinkOutcome> {
	let habiticaId: string;
	try {
		habiticaId = await create();
	} catch (error) {
		return { kind: 'habitica-failed', error: error instanceof TaskSourceError ? error.kind : 'Unknown' };
	}

	try {
		const outcome = await write(habiticaId);
		if (outcome) return outcome;
	} catch {
		// Fall through: the task exists, so the id must reach the user.
	}
	return { kind: 'write-failed', habiticaId };
}
