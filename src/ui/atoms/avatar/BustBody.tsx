import type { ReactNode } from 'react';
import { n, type Garment, type StageLook } from './looks';

/** The tunic with a scooped neck, and the sage's with a plain one. */
const TUNIC_SCOOP = 'M10 104C11 88 20 77.6 35 72.4C38.6 71.2 41.6 70.4 44 70Q50 76 56 70C58.4 70.4 61.4 71.2 65 72.4C80 77.6 89 88 90 104Z';
const TUNIC_FLAT = 'M10 104C11 88 20 77.6 35 72.4L50 70.4L65 72.4C80 77.6 89 88 90 104Z';

/** The himation over the left shoulder, its folds falling across the chest. */
const HIMATION = (
	<>
		<path className="dromos-portrait-himation" d="M65 72.4C80 77.6 89 88 90 104H34C44 96.4 53 88 58.6 79.2C60.6 76 62.6 73.6 65 72.4Z" />
		<path className="dromos-portrait-fold" d="M70.6 76.6C64 86 56 95 46.6 104M78.6 82C73 90.4 67.6 97.4 61 104M84.4 90C81 95 78 99.4 74.4 104" />
	</>
);

/** The two outer folds of a mantle hanging open over both shoulders. */
const MANTLE_FOLDS = <path className="dromos-portrait-fold" d="M22 84C24.6 90 26 97 26.4 104M78 84C75.4 90 74 97 73.6 104" />;

/**
 * What he wears over the tunic, by stage: the runner's mantle with its hood down, the same without
 * the hood, a wider cloak with a patch, the mantle folded over one shoulder, a chlamys pinned with a
 * brooch, the himation, a longer one bordered in ochre, and the sage's.
 */
const GARMENTS: Readonly<Record<Garment, ReactNode>> = {
	mantle: (
		<>
			<path
				className="dromos-portrait-himation"
				d="M33.4 73.2C33.6 67.8 38.6 64.2 44.4 64.6V70.4C41 70.8 37.4 71.8 33.4 73.2ZM66.6 73.2C66.4 67.8 61.4 64.2 55.6 64.6V70.4C59 70.8 62.6 71.8 66.6 73.2Z"
			/>
			<path className="dromos-portrait-himation" d="M10 104C11 88 19.4 78.2 33.6 73C36 79 37.6 87 38.2 94C38.4 97.4 38.4 100.6 38.2 104Z" />
			<path className="dromos-portrait-himation" d="M90 104C89 88 80.6 78.2 66.4 73C64 79 62.4 87 61.8 94C61.6 97.4 61.6 100.6 61.8 104Z" />
			<path className="dromos-portrait-hem" d="M33.6 73C36 79 37.6 87 38.2 94C38.4 97.4 38.4 100.6 38.2 104M66.4 73C64 79 62.4 87 61.8 94C61.6 97.4 61.6 100.6 61.8 104" />
			{MANTLE_FOLDS}
		</>
	),
	tidy: (
		<>
			<path className="dromos-portrait-himation" d="M10 104C11 88 19.4 78.2 34.4 72.8C36.4 79 37.8 87 38.4 94C38.6 97.4 38.6 100.6 38.4 104Z" />
			<path className="dromos-portrait-himation" d="M90 104C89 88 80.6 78.2 65.6 72.8C63.6 79 62.2 87 61.6 94C61.4 97.4 61.4 100.6 61.6 104Z" />
			<path className="dromos-portrait-hem" d="M34.4 72.8C36.4 79 37.8 87 38.4 94C38.6 97.4 38.6 100.6 38.4 104M65.6 72.8C63.6 79 62.2 87 61.6 94C61.4 97.4 61.4 100.6 61.6 104" />
			{MANTLE_FOLDS}
		</>
	),
	cloak: (
		<>
			<path
				className="dromos-portrait-himation"
				d="M32.4 73.6C32.2 67 37.8 62.6 44.4 63.2V70.4C40.6 70.8 36.6 72 32.4 73.6ZM67.6 73.6C67.8 67 62.2 62.6 55.6 63.2V70.4C59.4 70.8 63.4 72 67.6 73.6Z"
			/>
			<path className="dromos-portrait-himation" d="M9 104C10 87 18.6 76.6 34.6 72.4C38.4 79 40.4 88 41 96C41.2 99 41.2 101.6 41 104Z" />
			<path className="dromos-portrait-himation" d="M91 104C90 87 81.4 76.6 65.4 72.4C61.6 79 59.6 88 59 96C58.8 99 58.8 101.6 59 104Z" />
			<path className="dromos-portrait-hem" d="M34.6 72.4C38.4 79 40.4 88 41 96C41.2 99 41.2 101.6 41 104M65.4 72.4C61.6 79 59.6 88 59 96C58.8 99 58.8 101.6 59 104" />
			<path className="dromos-portrait-patch" d="M28.4 87.6L34.8 86.8L35.6 92.8L29.2 93.6Z" />
			<path className="dromos-portrait-crease" d="M29.6 89.6L30.2 89.4M34 89L34.6 88.8M30 92L30.6 91.8M34.4 91.4L35 91.2" />
			<path className="dromos-portrait-fold" d="M30 82C32.4 88 33.6 96 34 104M74 80C71 88 69.6 96 69.2 104M83 88C81 93 80 98 79.8 104" />
		</>
	),
	folded: (
		<>
			<path className="dromos-portrait-himation" d="M90 104C89 88 80.6 78 66 72.6C62 80 59.6 90 58.8 104Z" />
			<path className="dromos-portrait-hem" d="M66 72.6C62 80 59.6 90 58.8 104" />
			<path className="dromos-portrait-fold" d="M74 80C70 88 67.6 96 66.6 104M82 86C79 92 77.4 98 77 104" />
		</>
	),
	chlamys: (
		<>
			<path className="dromos-portrait-himation" d="M10 104C11 88 19.4 78.2 33.6 73L36.4 79.6C35 88 34.4 96 34.8 104Z" />
			<path className="dromos-portrait-himation" d="M90 104C89 87 81 76.6 65.4 72.4C58 73.4 47 75.6 37.6 79.6C41 87 44.2 95.4 46 104Z" />
			<path className="dromos-portrait-hem" d="M37.6 79.6C41 87 44.2 95.4 46 104" />
			<path className="dromos-portrait-fold" d="M40 80C48.4 83.6 57 90.4 62.4 104M40.6 79C53 80 67 84.6 79 96M33.4 82C31.6 89 30.6 96 30.4 104" />
			<circle className="dromos-portrait-brooch" cx="35.8" cy="78.8" r="3" />
		</>
	),
	himation: HIMATION,
	'himation-long': (
		<>
			{HIMATION}
			<path className="dromos-portrait-himation" d="M10 104C11 90 17.6 80.6 27.6 75.6C28.6 84 28.4 94 27.4 104Z" />
			<path className="dromos-portrait-hem" d="M34 104C44 96.4 53 88 58.6 79.2C60.6 76 62.6 73.6 65 72.4M27.6 75.6C28.6 84 28.4 94 27.4 104" />
		</>
	),
	sage: (
		<>
			<path className="dromos-portrait-fold" d="M38.4 74.6C36 82 34.6 92 34.4 104" />
			{HIMATION}
		</>
	),
};

/**
 * The bust's shoulders at its stage, in the 100-unit box: the neck, a cream tunic (dyed clavi down it
 * from the apprentice on), what he wears over it, and the waterskin's cord across the chest.
 */
export function BustBody({ look }: { readonly look: StageLook }) {
	return (
		<>
			<path className="dromos-portrait-skin" d="M44.4 50V71C46 73.6 54 73.6 55.6 71V50Z" />
			<path className="dromos-portrait-tunic" d={look.garment === 'sage' ? TUNIC_FLAT : TUNIC_SCOOP} />
			{look.clavi ? <path className="dromos-portrait-clavus" d="M39 71.2H42.2V104H39ZM57.8 71.2H61V104H57.8Z" /> : null}
			{GARMENTS[look.garment]}
			{look.waterskin ? <path className="dromos-portrait-cord" d="M32.4 74.4L36.4 72.6L71.6 104H67.2Z" /> : null}
		</>
	);
}

/** The satchel's strap, from the far shoulder down across the chest; the sage carries none. */
export function BustStrap({ look }: { readonly look: StageLook }) {
	return look.garment === 'sage' ? null : <path className="dromos-portrait-strap" d="M62.2 72.2L67.6 74.4L34 104H27.2Z" />;
}

/**
 * The staff beside him with the lantern on its hook, its glass lit at night: held in his right hand
 * while he travels, leaning on his shoulder once he holds a scroll, thicker and knotted from the
 * traveller on.
 */
export function BustStaff({ look }: { readonly look: StageLook }) {
	const held = look.hand === 'staff';
	const x = held ? 0 : -2.6;
	const w = look.staff === 'sturdy' ? 3.8 : 2.8;
	const x0 = n(20.6 + x - (w - 2.8) / 2);
	const lx = n(30 + x);
	return (
		<g className="dromos-portrait-staff-group">
			<circle className="dromos-portrait-glow" cx={lx} cy="22.4" r="9" />
			<path className="dromos-portrait-hook" d={`M${n(21.9 + x)} 18C${n(21.6 + x)} 12.4 ${n(28.4 + x)} 10.4 ${lx} 14.6`} />
			<rect className="dromos-portrait-wood" x={x0} y="16.6" width={w} height={held ? 88 : 66} rx="1" />
			{look.staff === 'sturdy' ? (
				<path
					className="dromos-portrait-fold"
					d={`M${x0} 55.4C${n(x0 + 1.2)} 56.6 ${n(x0 + 2.6)} 56.6 ${n(x0 + w)} 55.4M${x0} 66C${n(x0 + 1.2)} 67.2 ${n(x0 + 2.6)} 67.2 ${n(x0 + w)} 66`}
				/>
			) : null}
			<path className="dromos-portrait-ring" d={`M${lx} 14.6V17`} />
			<path className="dromos-portrait-lantern" d={`M${n(lx - 3)} 18.6L${lx} 16.2L${n(lx + 3)} 18.6Z`} />
			<path className="dromos-portrait-glass" d={`M${n(lx - 2.6)} 18.6H${n(lx + 2.6)}L${n(lx + 3.2)} 26.4H${n(lx - 3.2)}Z`} />
			<path className="dromos-portrait-fold" d={`M${lx} 18.6V26.4`} />
			<rect className="dromos-portrait-lantern" x={n(lx - 3.6)} y="26.4" width="7.2" height="1.6" rx="0.4" />
		</g>
	);
}

/** His right hand: on the staff while he travels, with the scroll held across his chest once he settles to study. */
export function BustRightHand({ look }: { readonly look: StageLook }) {
	if (look.hand === 'staff') {
		return (
			<>
				<path
					className="dromos-portrait-skin"
					d="M17.4 80.4C17.4 78.2 19.6 76.8 22.2 76.8C24.8 76.8 27.4 78.2 27.4 80.4V87C27.4 89.2 24.8 90.6 22.2 90.6C19.6 90.6 17.4 89.2 17.4 87Z"
				/>
				<path className="dromos-portrait-fold" d="M22.6 80.8H27.2M22.6 83.6H27.2M22.6 86.4H27" />
			</>
		);
	}
	return (
		<g transform="translate(3 -7) rotate(-38 27 92)">
			<rect className="dromos-portrait-scroll" x="9" y="88.2" width="36" height="7.6" rx="1.4" />
			<ellipse className="dromos-portrait-scroll" cx="45" cy="92" rx="1.8" ry="3.8" />
			<path className="dromos-portrait-fold" d="M15 88.2V95.8M39 88.2V95.8" />
			<path
				className="dromos-portrait-skin"
				d="M22.4 86.6C22.4 84.6 24.6 83.2 27.4 83.2C30.2 83.2 32.4 84.6 32.4 86.6V97.4C32.4 99.4 30.2 100.8 27.4 100.8C24.6 100.8 22.4 99.4 22.4 97.4Z"
			/>
			<path className="dromos-portrait-fold" d="M22.4 91.4H27M22.4 94.6H27" />
		</g>
	);
}

/**
 * His left hand raised at the upper right, where the level medallion leaves the sky clear, holding up
 * a skill's object; its sleeve runs down behind the medallion. Drawn around the object's origin.
 */
export function HoldingHand({ children }: { readonly children: ReactNode }) {
	return (
		<>
			<g transform="translate(-2.6 3.4)">
				<path className="dromos-portrait-himation" d="M-5.4 8C-6.6 14-7 21-6.4 30H7C7.2 21 6.6 14 5.6 8Z" />
				<path className="dromos-portrait-fold" d="M-2.6 14C-3 19-3 24-2.6 30" />
			</g>
			{children}
			<g transform="translate(-2.6 3.4)">
				<path className="dromos-portrait-skin" d="M-4.6 3.6C-4.6 1.6-2.6 0.4 0 0.4S4.8 1.6 4.8 3.6V9C4.8 11 2.6 12.2 0 12.2S-4.6 11-4.6 9Z" />
				<path className="dromos-portrait-fold" d="M-4.4 4.6H0.4M-4.4 7.4H0.4M-4.2 10H0.2" />
			</g>
		</>
	);
}
