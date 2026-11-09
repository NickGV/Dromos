import type { ReactNode } from 'react';

export interface SceneLayersProps {
	/** Names the scene for the stylesheet and for later art: `wall`, `desk`, `shelf`, `card`. */
	readonly scene: string;
	readonly className?: string;
	/** The line drawing of the scene, behind its panels; screen readers skip it. */
	readonly drawing: ReactNode;
	/** What is read and pressed: text on parchment, buttons. */
	readonly children: ReactNode;
}

/**
 * One scene of the library in three layers, back to front (M7 S6): the background, empty for now,
 * where a painted image from the vault can go later ("Arte propio"); the line drawing; and the
 * panels with the text and the buttons, which never sit straight on an image. The first two are
 * decoration and take no pointer, so a later image changes nothing a reader or a tap reaches.
 */
export function SceneLayers({ scene, className, drawing, children }: SceneLayersProps) {
	return (
		<div className={className ? `dromos-library-scene is-${scene} ${className}` : `dromos-library-scene is-${scene}`} data-scene={scene}>
			<div className="dromos-scene-layer is-background" data-layer="background" aria-hidden="true" />
			<div className="dromos-scene-layer is-drawing" data-layer="drawing" aria-hidden="true">
				{drawing}
			</div>
			<div className="dromos-scene-layer is-panels" data-layer="panels">
				{children}
			</div>
		</div>
	);
}
