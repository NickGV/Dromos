import type { Resource } from '../../src/domain/library/Resource';

/** A pending article saved on 2026-11-07, with a link and a reason; override any field. */
export function aResource(overrides: Partial<Resource> = {}): Resource {
	return {
		path: '04 - Resources/Posts-Papers/Como pensar en modulos.md',
		title: 'Cómo pensar en módulos',
		kind: 'post',
		author: 'Martin Fowler',
		url: 'https://martinfowler.com/articles/modules.html',
		why: 'entender los módulos',
		saved: '2026-11-07',
		finished: null,
		takeawayWritten: false,
		...overrides,
	};
}
