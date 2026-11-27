import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('../../../styles.css', import.meta.url), 'utf8');

/** The declarations of the rule whose selector starts a line of the stylesheet exactly as given. */
const ruleOf = (selector: string): string => {
	const at = css.indexOf(`\n${selector} {`);
	if (at < 0) return '';
	const open = css.indexOf('{', at + selector.length);
	return css.slice(open + 1, css.indexOf('}', open));
};

// A heading with no color of its own takes the theme's, and Material Gruvbox's `--h3-color` falls under
// AA on parchment (night-illustrations V1, advisory A2). Every Dromos heading is in its ink, as the card
// titles already are.
describe('the Library headings are in Dromos ink, not the theme heading color', () => {
	it('colors the card titles in ink (the rule the others follow)', () => {
		expect(ruleOf('.dromos-root .dromos-card-title')).toContain('color: var(--dromos-ink)');
	});

	it('colors the shelf row titles in ink', () => {
		expect(ruleOf('.dromos-root .dromos-shelf-row-title')).toContain('color: var(--dromos-ink)');
	});

	it('colors the section headings of the book and resource cards in ink', () => {
		expect(ruleOf('.dromos-root .dromos-book-section-heading')).toContain('color: var(--dromos-ink)');
	});
});
