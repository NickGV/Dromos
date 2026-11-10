import { useEffect, useRef, useState } from 'react';
import { WALK_MS, walkerPlacement, walkerTransform } from '../presenters/walkerView';

export interface WalkerProps {
	/** The share of the level done, 0..1, the place on the road it walks to; `null` stands it at the start. */
	readonly fraction: number | null;
}

/** Where the lantern's light is, hanging from the hook of the staff. */
const LAMP = { x: 25.6, y: -58.4 } as const;

/**
 * The walker of the design, a pilgrim runner (home-header S6), standing on the road at its share of
 * the level (game-ui S16), its feet at its origin, facing the gate: a cream tunic and an ochre belt,
 * a mantle with a hood, two folds and a hem, a satchel on a strap, sandals, and a staff with a
 * lantern hanging from its hook, lit at night. The ends of its sash stir in the wind. When the share
 * grows it walks there in about 1.2 s, slowing as it arrives, with a two-step bob; a smaller share,
 * the first one it is given and reduced motion move it at once. Drawn inside the landscape, which
 * screen readers skip.
 */
export function Walker({ fraction }: WalkerProps) {
	const { shown, walking } = useWalk(fraction);
	return (
		<g className={`dromos-walker${walking ? ' is-walking' : ''}`} transform={walkerTransform(walkerPlacement(shown))}>
			<ellipse className="dromos-scene-shadow" cx="2" cy="2" rx="16" ry="3.5" />
			<g className="dromos-walker-body">
				<g className="dromos-scene-figure">
					<circle className="dromos-scene-lamp-glow" cx={LAMP.x} cy={LAMP.y} r="10" />
					<path className="dromos-scene-staff" d="M20 2V-62.6C20 -67 25.6 -67.6 25.6 -64.2" />
					{/* Legs and sandals under the tunic's hem. */}
					<path className="dromos-scene-skin" d="M-5.4 -12L-5 -2.2H-2.2L-2 -12zM2.6 -12L3.2 -2.2H6L5.8 -12z" />
					<path className="dromos-scene-skin" d="M-7.2 0H-0.2C-0.2 -1.4-1.2 -2.4-2.6 -2.4H-5.8C-6.8 -2.4-7.4 -1.2-7.2 0zM1.8 0H8.8C8.8 -1.4 7.8 -2.4 6.4 -2.4H3.2C2.2 -2.4 1.6 -1.2 1.8 0z" />
					<path className="dromos-scene-sandal" d="M-7.2 0H-0.2M1.8 0H8.8M-5.2 -5L-2.2 -3.6M-4.6 -2.4L-3.6 -1M2.8 -5L5.9 -3.6M3.6 -2.4L4.6 -1" />
					<path className="dromos-scene-robe" d="M-6.4 -49L6.4 -49C8.4 -38 9.8 -24 11.2 -11.2L-11.4 -11.2C-10 -24-8.4 -38-6.4 -49z" />
					<path className="dromos-scene-fold" d="M-10.8 -14C-3.6 -13 3.8 -13 10.8 -14" />
					<path className="dromos-scene-belt" d="M-2.6 -31.4L9.4 -31.8" />
					{/* The mantle over the shoulders, open at the front, its hood down. */}
					<path className="dromos-scene-mantle" d="M-8 -49.2C-10.8 -51.6-10.4 -56.2-6.8 -56.8-5 -54.6-3.4 -52.2-1.8 -50.6z" />
					<path className="dromos-scene-mantle" d="M3 -50.8C6.2 -50.8 8.8 -49.2 9.6 -46.6L10.2 -41.8C8 -40.6 5.6 -41 4.2 -42.6 1.6 -38.2-0.4 -31.2-1 -22.6-4.6 -21-9.6 -20.6-14.4 -22-12.6 -30.4-11 -42.2-7.4 -50-4.8 -51.8 0 -52 3 -50.8z" />
					<path className="dromos-scene-fold" d="M-4.2 -46.4C-6.4 -38.6-7.2 -30.6-7.4 -22.4M-9 -44.6C-10.4 -37-11.4 -29.8-12.2 -22.8" />
					<path className="dromos-scene-hem" d="M-13.6 -23.8C-9.4 -22.4-5 -22.6-1.6 -24" />
					{/* The sash tied at the belt, its ends stirring back over the mantle's edge. */}
					<g className="dromos-walker-sash dromos-scene-life">
						<path className="dromos-scene-sash" d="M0 -31C-0.8 -27-2.2 -23.4-4.4 -20.4L-2.6 -19.6C-0.8 -22.6 0.4 -26.4 1.2 -30.6zM1.4 -30.8C1.6 -27 1.2 -23.6 0.2 -20.6L2 -20.2C3 -23.4 3.2 -27.2 2.8 -30.8zM-0.8 -31.4C-0.8 -32.6 2.8 -32.8 2.8 -31.4 2.8 -30.2-0.8 -30.2-0.8 -31.4z" />
					</g>
					{/* The satchel at the front hip, on a strap from the far shoulder. */}
					<path className="dromos-scene-strap" d="M-4.6 -50.2L7.4 -30.6" />
					<path className="dromos-scene-satchel" d="M4.6 -30.4H12.6L12.4 -22.6C12.4 -21.4 11.6 -20.6 10.4 -20.6H6.8C5.6 -20.6 4.8 -21.4 4.8 -22.6zM4.6 -30.4C5.6 -26.6 11.6 -26.6 12.6 -30.4" />
					{/* The near arm out of the mantle, its hand on the staff. */}
					<path className="dromos-scene-robe" d="M7.6 -45C10.8 -43 14.2 -41 17.8 -39.6L18.6 -42.2C15.2 -43.6 12 -45.8 9.4 -47.8z" />
					<circle className="dromos-scene-skin" cx="19.8" cy="-40.8" r="2" />
					<circle className="dromos-scene-head" cx="0.6" cy="-57.8" r="6.6" />
					<path className="dromos-scene-hair" d="M-5.9 -55.2C-7.6 -60.6-4.6 -65.2 0.4 -64.8 4 -64.6 6.6 -62.6 7 -59.8 4.6 -61.2 2 -61.2 0.2 -59.6-0.6 -57.8-1.6 -55.2-3.2 -53.4-4.4 -53.6-5.4 -54.2-5.9 -55.2z" />
					<circle className="dromos-scene-eye" cx="4.2" cy="-57.4" r="0.8" />
					<path className="dromos-scene-fold" d="M7.1 -57.6L8 -55.4 6.8 -55" />
					{/* The lantern on its ring: its glass, unlit by day, takes the lamp's light at night. */}
					<path className="dromos-scene-lantern" d="M23.8 -61.4H27.4L27.8 -55.6H23.4zM23.4 -61.4L25.6 -63.6 27.8 -61.4z" />
					<circle className="dromos-scene-lamp" cx={LAMP.x} cy={LAMP.y} r="1.6" />
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
