/**
 * The seal at the foot of a book card (M7 S5): the clay seal of the campaigns, a rosette pressed in
 * it, once the book is finished with its whole reflection; otherwise its empty outline. The text
 * beside it says which, so the drawing is decoration.
 */
export function BookSeal({ sealed }: { readonly sealed: boolean }) {
	if (!sealed) return <span className="dromos-book-seal is-empty" aria-hidden="true" />;
	return (
		<span className="dromos-seal dromos-book-seal is-sealed" aria-hidden="true">
			<svg className="dromos-book-seal-mark" viewBox="0 0 24 24" focusable="false">
				<circle cx="12" cy="12" r="8" />
				<path d="M12 6v12M6 12h12M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4" />
			</svg>
		</span>
	);
}
