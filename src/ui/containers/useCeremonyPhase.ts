import { useEffect, useState } from 'react';
import type { CeremonyPhase } from '../presenters/levelUpView';

/** After the bar fills, the medallion turns ochre; then the ribbon unfurls and the panel opens (game-ui S4). */
export const MEDAL_AFTER_MS = 700;
export const RIBBON_AFTER_MS = 2300;

interface Run {
	readonly level: number | null;
	readonly phase: CeremonyPhase;
}

const IDLE: Run = { level: null, phase: 'final' };

/**
 * The step of the level-up ceremony for the character level `level`, or `final` without one.
 * A new level starts it from the bar filling, then times the medallion and the ribbon. Under
 * `prefers-reduced-motion: reduce`, or where timers cannot run (server rendering), it is `final`
 * at once. Local only: it reads and writes nothing but this view's state.
 */
export function useCeremonyPhase(level: number | null): CeremonyPhase {
	const [run, setRun] = useState<Run>(IDLE);
	useEffect(() => {
		if (level === null) {
			setRun(IDLE);
			return undefined;
		}
		if (!canAnimate()) {
			setRun({ level, phase: 'final' });
			return undefined;
		}
		setRun({ level, phase: 'fill' });
		const medal = window.setTimeout(() => setRun({ level, phase: 'medal' }), MEDAL_AFTER_MS);
		const ribbon = window.setTimeout(() => setRun({ level, phase: 'final' }), RIBBON_AFTER_MS);
		return () => {
			window.clearTimeout(medal);
			window.clearTimeout(ribbon);
		};
	}, [level]);
	if (level === null) return 'final';
	// The first render of a new level, before the effect runs, already shows its first step.
	return run.level === level ? run.phase : canAnimate() ? 'fill' : 'final';
}

function canAnimate(): boolean {
	if (typeof window === 'undefined' || typeof window.setTimeout !== 'function') return false;
	return !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
