import { BookSeal } from '../atoms/BookSeal';
import { Umbilicus } from '../atoms/LibraryArt';
import { MarkdownBlock, type MarkdownRender } from '../atoms/MarkdownBlock';
import { ResourceArt } from '../atoms/ResourceArt';
import { ResourceLink } from '../atoms/ResourceLink';
import { SceneLayers } from '../atoms/SceneLayers';
import type { ResourceCardView } from '../presenters/resourceCardView';
import { focusOnDraw, followedLink } from './cardEvents';

export interface ResourceCardProps {
	readonly view: ResourceCardView;
	/** "Marcar como leído" is under way: its button says so and starts nothing more. */
	readonly busy: boolean;
	readonly onMark: () => void;
	/** Closes the card and opens the note, where what it left is written. */
	readonly onOpenNote: () => void;
	/** Draws what it left as Obsidian renders the note. */
	readonly renderMarkdown: MarkdownRender;
	/** Runs after a `[[link]]` in that text was followed: the note opens behind the card, so it closes. */
	readonly onFollowLink?: () => void;
	/** Moves the focus to "Abrir la nota" once drawn: the button that had it is gone after "Marcar como leído". */
	readonly focusNote?: boolean;
}

/**
 * The resource card (M8 S6), drawn inside the same Obsidian modal as the book card and in the same
 * frame, one sheet unrolled between two rods: the kind's object and its name, the title, the author
 * and the domain, the state, the dates, "Para qué me sirve", "Lo que me dejó" read-only (rendered as
 * the note, links resolved from the resource's path) and the seal. Under it, the link, "Marcar como
 * leído" (visto, escuchado) while it has no `finished`, and always "Abrir la nota"; long text
 * scrolls and the buttons stay at the foot, as in the book card. A busy button keeps its focus
 * (aria-disabled) and says what it is doing.
 */
export function ResourceCard({ view, busy, onMark, onOpenNote, renderMarkdown, onFollowLink, focusNote = false }: ResourceCardProps) {
	const { openLink, mark, openNote } = view.actions;
	return (
		<div className={`dromos-book-card dromos-resource-card is-${view.state}`}>
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
					<p className="dromos-resource-card-kind">
						<ResourceArt kind={view.kind} />
						<span>{view.kindLabel}</span>
					</p>
					<h2 className="dromos-book-card-title">{view.title}</h2>
					{view.source ? <p className="dromos-book-card-byline">{view.source}</p> : null}
					<p className={`dromos-book-card-state is-${view.state}`}>{view.stateLabel}</p>
					<p className="dromos-book-card-dates">{view.dates}</p>
					<div className="dromos-resource-card-parts" onClick={onFollowLink ? (event) => followedLink(event, onFollowLink) : undefined}>
						{view.why ? (
							<section className="dromos-resource-card-part">
								<h3 className="dromos-book-section-heading">{view.why.heading}</h3>
								<p className="dromos-resource-card-why">{view.why.text}</p>
							</section>
						) : null}
						<section className="dromos-resource-card-part">
							<h3 className="dromos-book-section-heading">{view.takeaway.heading}</h3>
							{view.takeaway.text !== null ? (
								<MarkdownBlock markdown={view.takeaway.text} sourcePath={view.path} render={renderMarkdown} className="dromos-book-section-text" />
							) : (
								<p className={view.takeaway.written ? 'dromos-book-section-status is-written' : 'dromos-book-section-status'}>{view.takeaway.status}</p>
							)}
						</section>
					</div>
					<div className="dromos-book-seal-row">
						<BookSeal sealed={view.seal.sealed} />
						<p className="dromos-book-seal-text">{view.seal.text}</p>
					</div>
				</div>
			</SceneLayers>
			<div className="dromos-book-card-actions">
				{openLink ? <ResourceLink key="link" href={openLink.href} label={openLink.label} /> : null}
				{mark ? (
					<button key="mark" type="button" className="dromos-btn is-primary" aria-disabled={busy ? true : undefined} onClick={busy ? undefined : onMark}>
						{busy ? mark.busyLabel : mark.label}
					</button>
				) : null}
				<button key="note" type="button" className={openNote.primary ? 'dromos-btn is-primary' : 'dromos-btn'} onClick={onOpenNote} ref={focusNote ? focusOnDraw : undefined}>
					{openNote.label}
				</button>
			</div>
		</div>
	);
}
