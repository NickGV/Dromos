import { READING_SKILL, type Book } from '../domain';
import type { BookRepository, Clock, LinkResult, StartReadingResult, TagCatalog, TaskCreator, TaskSourceErrorKind } from '../ports';
import { sendAndLink, type LinkOutcome } from './sendAndLink';

/** The text of a book's reading to-do. */
export interface ReadingTodo {
	readonly title: string;
	/** Holds a link that opens the book note. */
	readonly notes: string;
	/** "Terminar de leer" and the four reflection questions, in order (Q027). */
	readonly checklist: readonly string[];
}

export type StartReadingOutcome =
	/** The book is being read, and `habiticaId` is its reading to-do. */
	| { readonly kind: 'started'; readonly habiticaId: string }
	| { readonly kind: 'not-found' }
	/** The book is not pending (`planning`): nothing was created or written. */
	| { readonly kind: 'not-pending' }
	/** Habitica failed before the to-do existed: nothing was written (A2). */
	| { readonly kind: 'habitica-failed'; readonly error: TaskSourceErrorKind }
	/** The to-do exists in Habitica but the note could not be updated. */
	| { readonly kind: 'write-failed'; readonly habiticaId: string }
	/** The note was linked meanwhile, so the to-do just created is a duplicate the user has to delete. */
	| { readonly kind: 'duplicate'; readonly habiticaId: string };

export interface StartReadingDeps {
	readonly repository: BookRepository;
	readonly creator: TaskCreator;
	/** Where the `skill/lector` tag is found or created. */
	readonly tags: TagCatalog;
	/** Gives `started`. */
	readonly clock: Clock;
	/** The to-do's text for a book, built by the composition root from the UI copy. */
	readonly readingTodo: (book: Book) => ReadingTodo;
}

/**
 * "Empezar a leer" (S3, S4): a pending book gets one Habitica to-do with skill `lector` and the
 * reflection checklist, then `status: active`, `started` and `habitica_id`. A book that already
 * has a `habitica_id` never gets a second to-do. If Habitica fails nothing is written (A2).
 * Never rejects.
 */
export class StartReading {
	private readonly inFlight = new Map<string, Promise<StartReadingOutcome>>();

	constructor(private readonly deps: StartReadingDeps) {}

	/** Runs one start per book; a second call for the same book joins the one already running. */
	execute(path: string): Promise<StartReadingOutcome> {
		const running = this.inFlight.get(path);
		if (running) return running;

		const started = this.run(path).finally(() => this.inFlight.delete(path));
		this.inFlight.set(path, started);
		return started;
	}

	private async run(path: string): Promise<StartReadingOutcome> {
		const { repository, creator, tags, clock, readingTodo } = this.deps;
		const book = (await repository.list()).find((candidate) => candidate.path === path);
		if (!book) return { kind: 'not-found' };
		if (book.status !== 'planning') return { kind: 'not-pending' };

		const started = clock.today();
		// A to-do from a start that could not save the note: write the state, create nothing.
		if (book.habiticaId !== null) return this.resume(path, started, book.habiticaId);

		const outcome = await sendAndLink(
			async () => {
				// Tags first: if they fail nothing is created, so a retry cannot leave a duplicate to-do.
				const tagIds = await tags.ensureSkillTags([READING_SKILL]);
				const { title, notes, checklist } = readingTodo(book);
				return creator.createTodo({ title, notes, checklist, ...(tagIds.length > 0 ? { tags: tagIds } : {}) });
			},
			async (habiticaId) => asLinkResult(await repository.startReading(path, { started, habiticaId })),
		);
		return fromLinkOutcome(outcome);
	}

	private async resume(path: string, started: string, habiticaId: string): Promise<StartReadingOutcome> {
		let result: StartReadingResult;
		try {
			result = await this.deps.repository.startReading(path, { started, habiticaId });
		} catch {
			return { kind: 'write-failed', habiticaId };
		}
		switch (result) {
			case 'done':
				return { kind: 'started', habiticaId };
			// The note holds another to-do the list did not show yet: it was started elsewhere.
			case 'already-linked':
				return { kind: 'not-pending' };
			case 'not-found':
			case 'not-a-book':
				return { kind: 'not-found' };
		}
	}
}

/** What `sendAndLink` needs from a book write: a missing note or one that is no longer a book could not be linked. */
function asLinkResult(result: StartReadingResult): LinkResult {
	switch (result) {
		case 'done':
			return 'linked';
		case 'already-linked':
			return 'already-linked';
		case 'not-found':
		case 'not-a-book':
			return 'not-found';
	}
}

/** `sendAndLink` answers only `linked`, `habitica-failed`, `write-failed` and `duplicate`. */
function fromLinkOutcome(outcome: LinkOutcome): StartReadingOutcome {
	switch (outcome.kind) {
		case 'linked':
			return { kind: 'started', habiticaId: outcome.habiticaId };
		case 'habitica-failed':
		case 'write-failed':
		case 'duplicate':
			return outcome;
		// Campaign checks `sendAndLink` never makes, and the resend's `changed`; listed so a new kind fails to compile here.
		case 'already-linked':
		case 'not-found':
		case 'not-a-project':
		case 'changed':
			return { kind: 'not-found' };
	}
}
