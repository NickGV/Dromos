import { useEffect, useRef, useState } from 'react';
import { WALK_MS, walkerPlacement, walkerTransform } from '../presenters/walkerView';

export interface WalkerProps {
	/** The share of the level done, 0..1, the place on the road it walks to; `null` stands it at the start. */
	readonly fraction: number | null;
}

/**
 * The walker of the design, with a staff and an ochre belt, standing on the road at its share of
 * the level (game-ui S16), its feet at its origin. When the share grows it walks there in about
 * 1.2 s, slowing as it arrives, with a two-step bob; a smaller share, the first one it is given
 * and reduced motion move it at once. Drawn inside the landscape, which screen readers skip.
 */
export function Walker({ fraction }: WalkerProps) {
	const { shown, walking } = useWalk(fraction);
	return (
		<g className={`dromos-walker${walking ? ' is-walking' : ''}`} transform={walkerTransform(walkerPlacement(shown))}>
			<ellipse className="dromos-scene-shadow" cx="0" cy="2" rx="16" ry="3.5" />
			<g className="dromos-walker-body">
				<g className="dromos-scene-figure">
					<circle className="dromos-scene-lamp-glow" cx="20" cy="-62" r="10" />
					<path className="dromos-scene-staff" d="M20 -66V2" />
					<path className="dromos-scene-robe" d="M-6 -50L6 -50 13 -2-14 -2z" />
					<path className="dromos-scene-belt" d="M-8 -30L9 -30" />
					<path className="dromos-scene-limb" d="M6 -46L19 -38" />
					<circle className="dromos-scene-head" cx="0" cy="-58" r="7.2" />
					<path className="dromos-scene-hair" d="M-7 -59C-8 -67 7 -68 7 -59 3 -63-3 -63-7 -59z" />
					<path className="dromos-scene-limb" d="M-9 -2h6M5 -2h7" />
					<circle className="dromos-scene-lamp" cx="20" cy="-62" r="2.6" />
				</g>
			</g>
		</g>
	);
}

interface Walk {
	/** Where it is drawn now. */
	readonly shown: number;
	readonly walking: boolean;
}

/**
 * The share the walker is drawn at, walking towards `target`. It re-runs only when the target
 * changes, so the view's periodic re-render never restarts a walk; a new target mid-walk sets
 * off from where the walker is. Local only: it reads and writes nothing but this state.
 */
function useWalk(target: number | null): Walk {
	const [walk, setWalk] = useState<Walk>({ shown: target ?? 0, walking: false });
	const shown = useRef(walk.shown);
	const known = useRef(target !== null);
	useEffect(() => {
		if (target === null) return undefined;
		const from = shown.current;
		const first = !known.current;
		known.current = true;
		const show = (at: number, walking: boolean): void => {
			shown.current = at;
			setWalk({ shown: at, walking });
		};
		if (first || target <= from || !canWalk()) {
			show(target, false);
			return undefined;
		}
		let start: number | null = null;
		const step = (now: number): void => {
			start ??= now;
			const progress = Math.min(1, (now - start) / WALK_MS);
			if (progress >= 1) {
				show(target, false);
				return;
			}
			show(from + (target - from) * easeOut(progress), true);
			frame = window.requestAnimationFrame(step);
		};
		let frame = window.requestAnimationFrame(step);
		return () => window.cancelAnimationFrame(frame);
	}, [target]);
	return walk;
}

/** Ease-out quart, the curve of the bar catching up beside it (`cubic-bezier(0.25, 1, 0.5, 1)` in the stylesheet). */
function easeOut(progress: number): number {
	return 1 - (1 - progress) ** 4;
}

function canWalk(): boolean {
	if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return false;
	return !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
