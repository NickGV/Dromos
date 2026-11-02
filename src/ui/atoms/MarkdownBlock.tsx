import { useEffect, useRef } from 'react';

/** Renders `markdown` inside `host` and answers with the function that takes it out again. */
export type MarkdownRender = (host: HTMLElement, markdown: string, sourcePath: string) => () => void;

/** Text rendered as a note: React owns the box, `render` owns what is inside it. */
export function MarkdownBlock({ markdown, sourcePath, render }: { readonly markdown: string; readonly sourcePath: string; readonly render: MarkdownRender }) {
	const host = useRef<HTMLDivElement>(null);
	useEffect(() => (host.current ? render(host.current, markdown, sourcePath) : undefined), [markdown, sourcePath, render]);
	return <div ref={host} className="dromos-briefing-body markdown-rendered" />;
}
