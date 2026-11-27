import type { ReactNode } from 'react';
import type { ScenePaintingView } from '../presenters/sceneArtView';
import { SceneVideo } from './SceneVideo';

export interface SceneLayersProps {
	/** Names the scene for the stylesheet and for the art: `wall`, `desk`, `shelf`, `card`, `archive`, `shop`. */
	readonly scene: string;
	readonly className?: string;
	/** The time of day, for the stylesheet: the Shop's stall draws it (M10 S6), and at night in the light theme a painting turns to its dark one (night-illustrations S3). */
	readonly period?: string;
	/** The line drawing of the scene, behind its panels; screen readers skip it. */
	readonly drawing: ReactNode;
	/** The user's paintings for this scene from the vault (own-art S3); absent or `null`, the drawing shows. */
	readonly painting?: ScenePaintingView | null;
	/** What is read and pressed: text on parchment, buttons. */
	readonly children: ReactNode;
}

/**
 * One scene of the Library, or the Shop's stall (shop-art S1), in three layers, back to front (M7 S6): the background, where the user's
 * painting from the vault goes ("Arte propio", own-art S3), with its theme's video over it when there
 * is one (scene-video S2); the line drawing, which the stylesheet
 * hides in each theme that has a painting; and the panels with the text and the buttons, which never
 * sit straight on an image. The first two are decoration and take no pointer, so a painting changes
 * nothing a reader or a tap reaches.
 */
export function SceneLayers({ scene, className, period, drawing, painting = null, children }: SceneLayersProps) {
	const classes = ['dromos-library-scene', `is-${scene}`, className, painting?.className].filter(Boolean).join(' ');
	return (
		<div className={classes} data-scene={scene} data-period={period} style={painting?.style}>
			<div className="dromos-scene-layer is-background" data-layer="background" aria-hidden="true">
				{painting?.videos.map((video) => (
					<SceneVideo key={video.theme} view={video} />
				))}
			</div>
			<div className="dromos-scene-layer is-drawing" data-layer="drawing" aria-hidden="true">
				{drawing}
			</div>
			<div className="dromos-scene-layer is-panels" data-layer="panels">
				{children}
			</div>
		</div>
	);
}
