import { Component, Keymap, MarkdownRenderer, type App } from 'obsidian';

/**
 * Renders Markdown as Obsidian renders a note. Outside a note the links it draws do nothing on
 * their own, so the internal ones are opened here. Each call fills its own child: the render is
 * asynchronous, so one that finishes after its removal lands in a box no longer on the page.
 */
export function createMarkdownRender(app: App): (host: HTMLElement, markdown: string, sourcePath: string) => () => void {
	return (host, markdown, sourcePath) => {
		const owner = new Component();
		owner.load();
		const target = host.createDiv();
		target.addEventListener('click', (event) => {
			const link = (event.target as HTMLElement).closest('a.internal-link');
			const href = link?.getAttribute('data-href') ?? link?.getAttribute('href');
			if (!href) return;
			event.preventDefault();
			void app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(event));
		});
		// The text matters more than its format: if the render fails, it still shows.
		MarkdownRenderer.render(app, markdown, target, sourcePath, owner).catch(() => target.setText(markdown));
		return () => {
			owner.unload();
			target.remove();
		};
	};
}
