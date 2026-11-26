import type { CSSProperties } from 'react';
import { gradeMatrix, HOUR_GRADES } from '../../presenters/walkerArtView';

/** The figures' materials shaded over a painting (landscape-art S8), each named after the `--dromos-scene-*` token it mixes. */
const SHADED_MATERIALS =['robe', 'mantle', 'skin', 'satchel', 'felt', 'grey', 'white', 'house', 'gate', 'stone', 'patch'] as const;

/** The face, the hands and white or grey hair turn their shaded side to the gate: they are shaded less, so the face reads. */
const SOFT: ReadonlySet<string> = new Set(['skin', 'white', 'grey']);

/** The soft cast shadow, the fire's glow, the lantern's glow and the flame. */
const GLOWS = ['cast', 'glow', 'lamp', 'flame'] as const;

/** The painted walker's light of each graded hour (landscape-art S9): one colour matrix per hour, computed once. */
const HOUR_MATRICES = Object.entries(HOUR_GRADES).map(([hour, grade]) => [hour, gradeMatrix(grade)] as const);

/** The landscape's custom properties: each gradient's and each hour filter's url, so the stylesheet points at this view's own ids. */
export function shadingStyle(id: string): CSSProperties {
	const style: Record<string, string> = {};
	for (const name of [...SHADED_MATERIALS, ...GLOWS]) style[`--dromos-shade-${name}`] = `url(#${id}-${name})`;
	for (const [hour] of HOUR_MATRICES) style[`--dromos-hour-${hour}`] = `url(#${id}-${hour})`;
	return style;
}

/**
 * The gradients the walker, the gate and the campfire are painted with over the user's painting (landscape-art S8):
 * each material lit from the upper left, where the paintings' light comes from, with a rim of light at its lit edge,
 * and shaded on the right; at night the right edge takes the lantern's warmth. Their colours are the material's
 * token mixed with the hour's light and shade, custom properties the stylesheet sets per period, so nothing is
 * filtered. Radial ones soften the cast shadow, the fire's glow and the lantern's; the flame warms at its foot.
 * The painted walker (S9) is a picture, not shapes: it takes the hour's light from one colour-matrix filter
 * per hour, laid on its images alone, sized to each image's own box.
 */
export function FigureShading({ id }: { readonly id: string }) {
	return (
		<>
			{SHADED_MATERIALS.map((material) => (
				<linearGradient
					key={material}
					id={`${id}-${material}`}
					className={SOFT.has(material) ? 'dromos-shade is-soft' : 'dromos-shade'}
					x1="0"
					y1="0.15"
					x2="1"
					y2="0.5"
					style={{ '--dromos-shade-m': `var(--dromos-scene-${material})` } as CSSProperties}
				>
					<stop offset="0" className="is-rim" />
					<stop offset="0.16" className="is-lit" />
					<stop offset="0.42" className="is-base" />
					<stop offset="0.86" className="is-shade" />
					<stop offset="1" className="is-front" />
				</linearGradient>
			))}
			<radialGradient id={`${id}-cast`} className="dromos-shade-cast">
				<stop offset="0" className="is-core" />
				<stop offset="0.55" className="is-mid" />
				<stop offset="1" className="is-edge" />
			</radialGradient>
			<radialGradient id={`${id}-glow`} className="dromos-shade-glow">
				<stop offset="0" className="is-core" />
				<stop offset="0.5" className="is-mid" />
				<stop offset="1" className="is-edge" />
			</radialGradient>
			<radialGradient id={`${id}-lamp`} className="dromos-shade-lamp">
				<stop offset="0" className="is-core" />
				<stop offset="0.45" className="is-mid" />
				<stop offset="1" className="is-edge" />
			</radialGradient>
			<linearGradient id={`${id}-flame`} className="dromos-shade-flame" x1="0" y1="1" x2="0" y2="0">
				<stop offset="0" className="is-base" />
				<stop offset="1" className="is-tip" />
			</linearGradient>
			{HOUR_MATRICES.map(([hour, matrix]) => (
				<filter key={hour} id={`${id}-${hour}`} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
					<feColorMatrix type="matrix" values={matrix} />
				</filter>
			))}
		</>
	);
}
