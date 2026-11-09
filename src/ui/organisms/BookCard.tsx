import { BookSeal } from '../atoms/BookSeal';
import { Umbilicus } from '../atoms/LibraryArt';
import { SceneLayers } from '../atoms/SceneLayers';
import type { BookCardView } from '../presenters/bookCardView';

/** The state action under way, whose button says so; `null` while none is. */
export type BookCardBusy = 'start' | 'finish' | null;

export interface BookCardProps {
	readonly view: BookCardView;
	readonly busy: BookCardBusy;
	readonly onStart: () => void;
	readonly onFinish: () => void;
	/** Closes the card and opens the note, where the reflection is written. */
	readonly onOpenNote: () => void;
	/** Moves the focus to "Abrir la nota" once drawn: the button that had it is gone after "Terminar". */
	readonly focusNote?: boolean;
	/** Starts the id of the line under "Empezar a leer", unique to the open view. */
	readonly idPrefix?: string;
}

/**
 * The book card, level 3 of the library (M7 S5), drawn inside an Obsidian modal: one scroll
 * unrolled between its two rods, with the title, the byline, the state, the dates, the four parts
 * of the reflection and whether each is written (never their text, Q026), and the seal. Under it
 * the buttons its state allows. The modal's own close button and Escape close it: the card adds
 * no second one. A busy button keeps its focus (aria-disabled) and says what it is doing.
 */
export function BookCard({ view, busy, onStart, onFinish, onOpenNote, focusNote = false, idPrefix = 'dromos-library' }: BookCardProps) {
	const { start, finish, openNote } = view.actions;
	const hintId = `${idPrefix}-start-hint`;
	const idle = busy === null;
	return (
		<div className={`dromos-book-card is-${view.state}`}>
			<SceneLayers
				scene="card"
				drawing={
					<>
						<Umbilicus side="left" />
						<Umbilicus side="right" />
					</>
				}
			>
				<div className="dromos-book-sheet">
					<h2 className="dromos-book-card-title">{view.title}</h2>
					{view.byline ? <p className="dromos-book-card-byline">{view.byline}</p> : null}
					<p className={`dromos-book-card-state is-${view.state}`}>{view.stateLabel}</p>
					{view.dates ? <p className="dromos-book-card-dates">{view.dates}</p> : null}
					<ul className="dromos-book-sections" aria-label={view.sectionsLabel}>
						{view.sections.map((section) => (
							<li key={section.id} className={section.written ? 'dromos-book-section is-written' : 'dromos-book-section'}>
								<h3 className="dromos-book-section-heading">{section.heading}</h3>
								<p className={section.written ? 'dromos-book-section-status is-written' : 'dromos-book-section-status'}>{section.status}</p>
							</li>
						))}
					</ul>
					<div className="dromos-book-seal-row">
						<BookSeal sealed={view.seal.sealed} />
						<p className="dromos-book-seal-text">{view.seal.text}</p>
					</div>
				</div>
			</SceneLayers>
			<div className="dromos-book-card-actions">
				{start ? (
					<div key="state" className="dromos-book-card-action">
						<button type="button" className="dromos-btn is-primary" aria-describedby={hintId} aria-disabled={idle ? undefined : true} onClick={idle ? onStart : undefined}>
							{busy === 'start' ? start.busyLabel : start.label}
						</button>
						<p className="dromos-book-card-hint" id={hintId}>
							{start.hint}
						</p>
					</div>
				) : null}
				{finish ? (
					<div key="state" className="dromos-book-card-action">
						<button type="button" className="dromos-btn is-primary" aria-disabled={idle ? undefined : true} onClick={idle ? onFinish : undefined}>
							{busy === 'finish' ? finish.busyLabel : finish.label}
						</button>
					</div>
				) : null}
				<button key="note" type="button" className={openNote.primary ? 'dromos-btn is-primary' : 'dromos-btn'} onClick={onOpenNote} ref={focusNote ? focusOnDraw : undefined}>
					{openNote.label}
				</button>
			</div>
		</div>
	);
}

function focusOnDraw(button: HTMLButtonElement | null): void {
	button?.focus({ preventScroll: true });
}
