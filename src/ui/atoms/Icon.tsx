import { useEffect, useRef } from 'react';

/** Draws the icon `name` inside `host`, replacing what was there; built in `src/composition`. */
export type IconRender = (host: HTMLElement, name: string) => void;

/** A line icon from the host app, decorative: whatever names it sits next to it as text. */
export function Icon({ name, render, className }: { readonly name: string; readonly render: IconRender; readonly className?: string }) {
	const host = useRef<HTMLSpanElement>(null);
	useEffect(() => {
		if (host.current) render(host.current, name);
	}, [name, render]);
	return <span ref={host} className={className} aria-hidden="true" />;
}
