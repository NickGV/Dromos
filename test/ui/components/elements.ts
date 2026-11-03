import { isValidElement, type ReactElement, type ReactNode } from 'react';

type Element = ReactElement<Record<string, unknown>>;

/**
 * Every host element in the tree a hook-free component returns, depth first. Components inside
 * it are not called, so only what the component itself draws is searched. The test environment
 * has no DOM, so this is how a test reaches a button's `onClick`.
 */
export function elementsOf(node: ReactNode): Element[] {
	if (Array.isArray(node)) return node.flatMap((child: ReactNode) => elementsOf(child));
	if (!isValidElement(node)) return [];
	const element = node as Element;
	const own = typeof element.type === 'string' ? [element] : [];
	return [...own, ...elementsOf(element.props.children as ReactNode)];
}

/** The `onClick` of the only `<button>` in the tree. */
export function clickOf(node: ReactNode): () => void {
	const buttons = elementsOf(node).filter((element) => element.type === 'button');
	if (buttons.length !== 1) throw new Error(`expected one button, found ${buttons.length}`);
	const onClick = buttons[0]?.props.onClick;
	if (typeof onClick !== 'function') throw new Error('the button has no onClick');
	return onClick as () => void;
}
