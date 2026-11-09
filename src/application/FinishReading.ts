import type { BookRepository, BookWriteResult, Clock } from '../ports';

export type FinishReadingOutcome =
	/** The book is `completed`, with today as `finished`. */
	| { readonly kind: 'finished' }
	| { readonly kind: 'not-found' }
	/** The book is not being read (`active`): nothing was written. */
	| { readonly kind: 'not-reading' }
	/** The note could not be saved: the book is still being read. */
	| { readonly kind: 'write-failed' };

export interface FinishReadingDeps {
	readonly repository: BookRepository;
	/** Gives `finished`. */
	readonly clock: Clock;
}

/**
 * "Terminar" (S4): a book being read becomes `completed`, with `finished` set to today. It does
 * not touch Habitica: the reading to-do is completed there by the user (A2). The book is sealed
 * only once its reflection is written (S2). Never rejects.
 */
export class FinishReading {
	constructor(private readonly deps: FinishReadingDeps) {}

	async execute(path: string): Promise<FinishReadingOutcome> {
		const { repository, clock } = this.deps;
		const book = (await repository.list()).find((candidate) => candidate.path === path);
		if (!book) return { kind: 'not-found' };
		if (book.status !== 'active') return { kind: 'not-reading' };

		let result: BookWriteResult;
		try {
			result = await repository.finishReading(path, { finished: clock.today() });
		} catch {
			return { kind: 'write-failed' };
		}
		return result === 'done' ? { kind: 'finished' } : { kind: 'not-found' };
	}
}
