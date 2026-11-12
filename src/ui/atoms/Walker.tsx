import { useEffect, useRef, useState } from 'react';
import { FIRST_AVATAR, type AvatarView } from '../presenters/avatar';
import { WALK_MS, walkerPlacement, walkerTransform } from '../presenters/walkerView';
import { WalkerFigure } from './avatar/WalkerFigure';

export interface WalkerProps {
	/** The share of the level done, 0..1, the place on the road it walks to; `null` stands it at the start. */
	readonly fraction: number | null;
	/** Who walks (M11 S1): the character's stage and the objects of its skills; the young runner by default. */
	readonly avatar?: AvatarView;
}

/**
 * The walker of the design, the character on the road (home-header S6, M11 S1), standing at its share
 * of the level (game-ui S16), its feet at its origin, facing the gate: the same figure as the plaque's
 * portrait, at the same stage with the same objects, from the young pilgrim runner with his satchel,
 * his hooded mantle and his staff with a lantern lit at night, to the sage. Its group names the stage.
 * When the share grows it walks there in about 1.2 s, slowing as it arrives, with a two-step bob; a
 * smaller share, the first one it is given and reduced motion move it at once. Drawn inside the
 * landscape, which screen readers skip.
 */
export function Walker({ fraction, avatar = FIRST_AVATAR }: WalkerProps) {
	const { shown, walking } = useWalk(fraction);
	return (
		<g className={`dromos-walker is-${avatar.stage}${walking ? ' is-walking' : ''}`} transform={walkerTransform(walkerPlacement(shown))}>
			<ellipse className="dromos-scene-shadow" cx="2" cy="2" rx="16" ry="3.5" />
			<g className="dromos-walker-body">
				<WalkerFigure avatar={avatar} />
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
