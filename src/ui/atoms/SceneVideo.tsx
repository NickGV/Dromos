import { useEffect, useRef } from 'react';
import type { SceneVideoView } from '../presenters/sceneArtView';
import { watchSight } from './landscape/sight';
import { playWhileSeen } from './scenePlayback';

/**
 * A scene's short loop over its painting (scene-video S1-S4): muted, looping, inline, its painting as
 * the poster, so the scene shows the painting until the first frame and whenever it cannot play. It
 * plays only while seen; the stylesheet shows only the current theme's and none under reduced motion.
 */
export function SceneVideo({ view }: { readonly view: SceneVideoView }) {
	const ref = useRef<HTMLVideoElement>(null);
	useEffect(() => {
		const video = ref.current;
		if (!video) return undefined;
		return playWhileSeen(video, video.ownerDocument, (onSight) => watchSight(video, onSight));
	}, [view.src]);
	return <video ref={ref} className={`dromos-scene-video is-${view.theme}`} src={view.src} poster={view.poster} muted loop playsInline preload="none" />;
}
