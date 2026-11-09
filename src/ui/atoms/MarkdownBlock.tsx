import { useEffect, useRef } from 'react';

/** Renders `markdown` inside `host` and answers with the function that takes it out again. */
export type MarkdownRender = (host: HTMLElement, markdown: string, sourcePath: string) => () => void;

export interface MarkdownBlockProps {
	readonly markdown: string;
	/** The note the text belongs to, so its `[[links]]` resolve from there. */
	readonly sourcePath: string;
	readonly render: MarkdownRender;
	/** The box's own class, beside Obsidian's `markdown-rendered`; the briefing's when absent. */
	readonly className?: string;
}

/** Text rendered as a note: React owns the box, `render` owns what is inside it. */
export function MarkdownBlock({ markdown, sourcePath, render, className = 'dromos-briefing-body' }: MarkdownBlockProps) {
	const host = useRef<HTMLDivElement>(null);
	useEffect(() => (host.current ? render(host.current, markdown, sourcePath) : undefined), [markdown, sourcePath, render]);
	return <div ref={host} className={`${className} markdown-rendered`} />;
}
