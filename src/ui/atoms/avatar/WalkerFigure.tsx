import type { ReactNode } from 'react';
import type { StageId } from '../../../domain/character/Stage';
import type { AvatarView } from '../../presenters/avatar';
import { WALKER_LAYER, walkerAnchor, type WalkerLayer } from './anchors';
import { isOpenMantle, n, STAGE_LOOKS, type Beard, type Garment, type Hair, type StageLook } from './looks';
import { placedObjects, SkillObject, type PlacedObject } from './SkillObject';

/** Where the lantern's light hangs from the hook of the staff while he walks upright. */
const LAMP = { x: 25.6, y: -58.4 } as const;

/** The walker's hair by stage, on the head circle at (0.6, -57.8), r 6.6, facing right. */
const WALKER_HAIR: Readonly<Record<Hair, ReactNode>> = {
	young: <path className="dromos-scene-hair" d="M-5.9 -55.2C-7.6 -60.6-4.6 -65.2 0.4 -64.8 4 -64.6 6.6 -62.6 7 -59.8 4.6 -61.2 2 -61.2 0.2 -59.6-0.6 -57.8-1.6 -55.2-3.2 -53.4-4.4 -53.6-5.4 -54.2-5.9 -55.2z" />,
	long: (
		<>
			<path className="dromos-scene-hair" d="M-5.4 -52.4C-7.6 -55-7.8 -61-4.6 -63.8-2 -66 2.8 -66 5.4 -64.2 6.8 -63.2 7.4 -61.6 7.4 -60 5 -61.4 2.4 -61.4 0.4 -59.8-0.6 -57.6-1.2 -54.4-2.4 -51.8-3.4 -51.2-4.6 -51.4-5.4 -52.4z" />
			<path className="dromos-scene-hair" d="M0 -64.8C0.8 -67 3.6 -67.6 5 -66 3.4 -66.2 2 -65.6 1.4 -64.6z" />
		</>
	),
	combed: (
		<>
			<path className="dromos-scene-hair" d="M-5.9 -55.4C-7.4 -61-4.4 -65 0.6 -64.8 4.4 -64.6 6.8 -62.6 7 -60 5 -60.8 2.6 -61 0.6 -60.4-0.8 -59.2-1.8 -57.4-2.6 -55-3.8 -53.6-5 -54-5.9 -55.4z" />
			<path className="dromos-scene-fold" d="M0.6 -60.4C2 -62.4 4.6 -63.2 6.6 -62.4" />
		</>
	),
	neat: <path className="dromos-scene-hair" d="M-5.9 -55.4C-7.4 -61-4.4 -65 0.6 -64.8 4.4 -64.6 6.6 -62.8 6.8 -60.4 4.8 -61.2 2.6 -61.2 0.6 -60.4-0.8 -59.2-1.8 -57.4-2.6 -55-3.8 -53.6-5 -54-5.9 -55.4z" />,
	temples: (
		<>
			<path className="dromos-scene-hair" d="M-5.9 -55.4C-7.4 -61-4.4 -65 0.6 -64.8 4.4 -64.6 6.6 -62.8 6.8 -60.4 4.8 -61.2 2.6 -61.2 0.6 -60.4-0.8 -59.2-1.8 -57.4-2.6 -55-3.8 -53.6-5 -54-5.9 -55.4z" />
			<path className="dromos-scene-grey" d="M-5.9 -55.4C-6.6 -57.6-6.4 -59.6-5.6 -61.2-3.8 -59.8-2.6 -57.8-2 -56.2-2.6 -55-3.8 -53.6-5 -54-5.9 -55.4z" />
		</>
	),
	thinning: (
		<>
			<path className="dromos-scene-grey" d="M-5.9 -55.2C-7 -58.6-6.2 -61.8-3.8 -63.4-2.4 -61.8-1.6 -59.6-1.4 -57.4-1.8 -55.2-3.2 -53.4-4.4 -53.6-5.4 -54.2-5.9 -55.2z" />
			<path className="dromos-scene-grey" d="M-1.6 -63.8C0 -65.2 2.6 -65.2 3.8 -64.2 2 -63.8 0.6 -63.4-0.2 -62.6z" />
		</>
	),
	sage: <path className="dromos-scene-white" d="M-5.9 -55.2C-6.8 -57.6-6.4 -60.2-5 -61.8-3.6 -60.4-2.6 -58.2-2.2 -56-2.4 -54.2-3.6 -53.4-4.8 -53.8-5.9 -55.2z" />,
};

/** The walker's beard, along the jaw from below the ear to the chin, longer and greyer with the years. */
const WALKER_BEARD: Readonly<Record<Beard, ReactNode>> = {
	down: <path className="dromos-scene-stubble" d="M0.2 -55.4C0.4 -53 2.2 -51.4 4.4 -51.2 6 -51.2 7.2 -52 7.6 -53.4 7 -53.4 6.4 -53.6 6 -54 4.6 -53.2 2.6 -53.4 1.4 -55.6z" />,
	short: <path className="dromos-scene-hair" d="M0.2 -55.4C0.4 -52.8 2.2 -51 4.6 -50.8 6.4 -50.8 7.6 -51.8 7.9 -53.4 7.2 -53.4 6.6 -53.6 6.2 -54 4.8 -53 2.8 -53.2 1.6 -55.6z" />,
	trimmed: <path className="dromos-scene-hair" d="M0.2 -55.4C0.2 -52.4 2 -49.8 4.6 -49.4 6.6 -49.2 7.9 -50.6 8.1 -53.4 7.3 -53.4 6.6 -53.6 6.2 -54 4.8 -53 2.8 -53.2 1.6 -55.6z" />,
	full: (
		<>
			<path className="dromos-scene-hair" d="M-0.2 -55.8C-0.6 -51.8 0.8 -48 3.6 -46.8 6.2 -45.8 8.2 -47.4 8.6 -50.8 8.7 -52 8.5 -53 8.2 -53.6 7.4 -53.4 6.7 -53.6 6.2 -54 4.8 -53 2.6 -53.2 1.2 -55.8z" />
			<path className="dromos-scene-fold" d="M2.8 -51.4C3.6 -49.6 4.8 -48.4 6.2 -47.8" />
		</>
	),
	'full-grey': (
		<>
			<path className="dromos-scene-hair" d="M-0.2 -55.8C-0.6 -51.8 0.8 -48 3.6 -46.8 6.2 -45.8 8.2 -47.4 8.6 -50.8 8.7 -52 8.5 -53 8.2 -53.6 7.4 -53.4 6.7 -53.6 6.2 -54 4.8 -53 2.6 -53.2 1.2 -55.8z" />
			<path className="dromos-scene-grey" d="M-0.2 -55.8C-0.6 -53.4-0.2 -51.2 0.8 -49.8 1.8 -51.4 2 -53.6 1.2 -55.8z" />
			<path className="dromos-scene-streak" d="M3.6 -50.6C4.4 -49 5.4 -48 6.6 -47.4" />
		</>
	),
	grey: (
		<>
			<path className="dromos-scene-grey" d="M-0.2 -55.8C-1 -51-0.2 -46 2.6 -43 4.6 -40.8 6.8 -40.4 8 -42.4 9 -44.8 9.2 -49 8.8 -52.4 8.6 -53.2 8.4 -53.6 7.4 -53.4 6.7 -53.6 6.2 -54 4.8 -53 2.6 -53.2 1.2 -55.8z" />
			<path className="dromos-scene-fold" d="M2.6 -50.6C3.4 -47.8 4.6 -45.4 6.2 -43.4" />
		</>
	),
	white: (
		<>
			<path className="dromos-scene-white" d="M-0.2 -55.8C-1.2 -50.4-0.4 -44.4 2.4 -40.4 4.4 -37.8 6.8 -37 8 -39.2 9.2 -42 9.4 -47.8 8.8 -52.4 8.6 -53.2 8.4 -53.6 7.4 -53.4 6.7 -53.6 6.2 -54 4.8 -53 2.6 -53.2 1.2 -55.8z" />
			<path className="dromos-scene-fold" d="M2.6 -50.4C3.4 -46.6 4.6 -43 6.4 -40.4M5.6 -51.6C6.2 -48.4 6.8 -45.4 7.6 -42.6" />
		</>
	),
};

/** The open mantle's back panel, its folds and its ochre hem, shared by the runner's and the tidied mantle. */
const OPEN_MANTLE_BACK = (
	<>
		<path
			className="dromos-scene-mantle"
			d="M3 -50.8C6.2 -50.8 8.8 -49.2 9.6 -46.6L10.2 -41.8C8 -40.6 5.6 -41 4.2 -42.6 1.6 -38.2-0.4 -31.2-1 -22.6-4.6 -21-9.6 -20.6-14.4 -22-12.6 -30.4-11 -42.2-7.4 -50-4.8 -51.8 0 -52 3 -50.8z"
		/>
		<path className="dromos-scene-fold" d="M-4.2 -46.4C-6.4 -38.6-7.2 -30.6-7.4 -22.4M-9 -44.6C-10.4 -37-11.4 -29.8-12.2 -22.8" />
		<path className="dromos-scene-hem" d="M-13.6 -23.8C-9.4 -22.4-5 -22.6-1.6 -24" />
	</>
);

/** The himation's short panel over the far shoulder. */
const HIMATION_SHOULDER = <path className="dromos-scene-mantle" d="M-6.8 -50.4C-10 -48-11.6 -42-12.4 -36L-9.4 -35.4C-8.6 -41-7.6 -46-5.4 -49.4z" />;

/** The long himation down to the shins, with an ochre border at its hem, `hem` units over his feet. */
function LongHimation({ hem }: { readonly hem: number }) {
	return (
		<>
			<path className="dromos-scene-mantle" d="M-6.8 -50.4C-10 -48-11.8 -41-12.6 -34L-9.6 -33.4C-8.6 -40-7.6 -46-5.4 -49.4z" />
			<path
				className="dromos-scene-mantle"
				d={`M-2 -51.6C1.6 -52 4.4 -50.6 5.2 -48.4 7.4 -44.6 9.2 -40.6 9.8 -36.8 10.8 -28 11.8 -18 12.4 ${n(hem + 1.4)} 6 ${n(hem + 3)}-2 ${n(hem + 3)}-12.8 ${n(hem + 1.6)}-11.6 -22-10.2 -38-8.2 -46.4-7.4 -50.4-5 -51.8-2 -51.6z`}
			/>
			<path className="dromos-scene-fold" d={`M-5.6 -46.4C-1.2 -40.4 3.4 -31.6 7.4 -21.4M-9.4 -36C-5 -29-1.2 -20.6 1.6 ${n(hem + 3.2)}M-10.8 -22.6C-8.4 -18.6-6.4 -14.6-5 ${n(hem + 3)}`} />
			<path className="dromos-scene-hem" d={`M-12.4 ${n(hem + 0.4)}C-6 ${n(hem + 2.2)} 4 ${n(hem + 2.2)} 12 ${n(hem + 0.2)}`} />
		</>
	);
}

/**
 * What the walker wears over the tunic, by stage: the runner's mantle with its hood down, the same
 * without the hood, a wider patched cloak, the mantle folded over a shoulder, the traveller's chlamys
 * pinned with a brooch, the himation, and the long bordered himation that falls lower as he ages.
 */
const WALKER_GARMENTS: Readonly<Record<Exclude<Garment, 'himation-long'>, ReactNode>> = {
	mantle: (
		<>
			<path className="dromos-scene-mantle" d="M-8 -49.2C-10.8 -51.6-10.4 -56.2-6.8 -56.8-5 -54.6-3.4 -52.2-1.8 -50.6z" />
			{OPEN_MANTLE_BACK}
		</>
	),
	tidy: OPEN_MANTLE_BACK,
	cloak: (
		<>
			<path className="dromos-scene-mantle" d="M-8.4 -49C-11.6 -51.6-11.2 -56.8-7 -57.4-5 -55-3.4 -52.4-1.8 -50.6z" />
			<path
				className="dromos-scene-mantle"
				d="M3 -50.8C6.2 -50.8 8.8 -49.2 9.6 -46.6L10.4 -41.2C8 -40 5.6 -40.4 4.2 -42 1.6 -37-0.2 -29-0.6 -18.8-5 -17-10.6 -16.6-16 -18.4-14.2 -28.4-12 -41.6-7.4 -50-4.8 -51.8 0 -52 3 -50.8z"
			/>
			<path className="dromos-scene-patch" d="M-12.6 -33.4L-8.8 -34L-8.2 -30.2L-12 -29.6z" />
			<path className="dromos-scene-fold" d="M-4.2 -46.4C-6.4 -37.6-7.2 -28.6-7.2 -18.6M-9 -44.6C-10.6 -36-11.8 -27.4-12.8 -19" />
			<path className="dromos-scene-hem" d="M-15.2 -20C-10.6 -18.4-5.6 -18.6-1 -20.2" />
		</>
	),
	folded: (
		<>
			<path
				className="dromos-scene-mantle"
				d="M3 -50.8C6.2 -50.8 8.8 -49.2 9.6 -46.6L10 -42.6C8 -41.6 5.8 -41.8 4.4 -43.4 2 -39.4 0.4 -33.4-0.2 -26.2-4.6 -24.8-9 -24.6-13 -25.8-11.6 -33-10.4 -42.4-7.4 -49.4-4.8 -51.6 0 -52 3 -50.8z"
			/>
			<path className="dromos-scene-fold" d="M-3.6 -47C-5.6 -40-6.4 -33.2-6.6 -26.2" />
			<path className="dromos-scene-hem" d="M-12.4 -27.2C-8.6 -26-4.6 -26.2-0.8 -27.6" />
		</>
	),
	chlamys: (
		<>
			<path
				className="dromos-scene-mantle"
				d="M3.4 -50.8C6.6 -50.6 9 -49 9.8 -46.4L10.6 -40.4C8.2 -39.2 5.8 -39.6 4.4 -41.2 1.8 -35.4 0.4 -26.6 0.2 -15.6-5.4 -13.8-11.4 -13.6-16.8 -15.6-15.4 -26.6-13 -40.6-8 -50-5.2 -52 0 -52 3.4 -50.8z"
			/>
			<path className="dromos-scene-fold" d="M-3.6 -46.4C-6 -36.6-6.8 -25.6-6.8 -14.6M-9.4 -44.4C-11.2 -35.4-12.6 -25.4-13.4 -15.2M0.4 -47.6C-1.4 -40-2.2 -31.4-2.4 -22.6" />
			<path className="dromos-scene-hem" d="M-16 -16.8C-11 -15-5.6 -15.2-0.2 -17" />
			<circle className="dromos-scene-brooch" cx="4.6" cy="-48.6" r="1.5" />
		</>
	),
	himation: (
		<>
			{HIMATION_SHOULDER}
			<path
				className="dromos-scene-mantle"
				d="M-2 -51.6C1.6 -52 4.4 -50.6 5.2 -48.4 7.4 -44.6 9.2 -40.6 9.8 -36.8 10.6 -30 11.4 -22 12 -15.4 6 -13.8-2 -13.8-12.6 -15-11.4 -26-10.2 -38-8.2 -46.4-7.4 -50.4-5 -51.8-2 -51.6z"
			/>
			<path className="dromos-scene-fold" d="M-5.6 -46.4C-1.2 -40.4 3.6 -32.6 7.6 -23.4M-9.4 -36C-5 -29.6-1.2 -22.6 1.8 -15.2M-10.6 -24.6C-8.2 -21.4-6 -18.2-4.6 -15" />
		</>
	),
	sage: <LongHimation hem={-8.4} />,
};

/** How far above his feet the long himation's hem falls, lower as he ages. */
const LONG_HEM: Readonly<Partial<Record<StageId, number>>> = { counsellor: -10.2, elder: -9 };

function WalkerGarment({ look, stage }: { readonly look: StageLook; readonly stage: StageId }) {
	return look.garment === 'himation-long' ? <LongHimation hem={LONG_HEM[stage] ?? -11.4} /> : WALKER_GARMENTS[look.garment];
}

/** The traveller's petasos on the walker's head, tilted a little back, with its band. */
const WALKER_HAT = (
	<>
		<path className="dromos-scene-felt" d="M-9.6 -61.4C-9 -63.6-4 -64.8 1.4 -64.6S10.6 -63 11 -61C10.2 -60 5.4 -59.6 0.4 -59.8S-9 -60.4-9.6 -61.4z" />
		<path className="dromos-scene-felt" d="M-3.8 -62.8C-4.4 -66.6-2.2 -69.4 1 -69.4S5.8 -66.8 5.6 -62.6C3.6 -62 1.2 -62-3.8 -62.8z" />
		<path className="dromos-scene-hem" d="M-3.8 -63.6C-0.6 -62.8 2.8 -62.8 5.6 -63.4" />
	</>
);

/** The sash tied at the belt, its ends stirring back over the open mantle's edge. */
const SASH = (
	<g className="dromos-walker-sash dromos-scene-life">
		<path
			className="dromos-scene-sash"
			d="M0 -31C-0.8 -27-2.2 -23.4-4.4 -20.4L-2.6 -19.6C-0.8 -22.6 0.4 -26.4 1.2 -30.6zM1.4 -30.8C1.6 -27 1.2 -23.6 0.2 -20.6L2 -20.2C3 -23.4 3.2 -27.2 2.8 -30.8zM-0.8 -31.4C-0.8 -32.6 2.8 -32.8 2.8 -31.4 2.8 -30.2-0.8 -30.2-0.8 -31.4z"
		/>
	</g>
);

/** The waterskin on its cord, hanging at the far hip, its cord crossing the satchel's strap. */
const WATERSKIN = (
	<>
		<path className="dromos-scene-strap is-cord" d="M-11 -29.6L-2.6 -50.6" />
		<path className="dromos-scene-satchel" d="M-13.8 -28C-17.8 -26.8-18.8 -21.2-16.2 -17.8-13.6 -14.8-8.8 -15.2-7.6 -18.6-6.8 -21.4-8.6 -25-11 -27z" />
		<path className="dromos-scene-satchel" d="M-12.8 -28.8L-12.2 -31.2-10 -30.6-10.6 -27.8z" />
	</>
);

/** The satchel at the front hip; later a case of scrolls, the capsa, with its lid. */
const SATCHEL = (
	<path
		className="dromos-scene-satchel"
		d="M4.6 -30.4H12.6L12.4 -22.6C12.4 -21.4 11.6 -20.6 10.4 -20.6H6.8C5.6 -20.6 4.8 -21.4 4.8 -22.6zM4.6 -30.4C5.6 -26.6 11.6 -26.6 12.6 -30.4"
	/>
);
const CAPSA = (
	<>
		<path className="dromos-scene-satchel" d="M5.2 -34.6H11L10.8 -21.4C10.8 -20.2 9.6 -19.4 8 -19.4S5.2 -20.2 5.2 -21.4z" />
		<path className="dromos-scene-capsa-lid" d="M4.8 -36.2H11.4V-33.6H4.8z" />
		<path className="dromos-scene-fold" d="M5.2 -27.4H10.9" />
	</>
);

/** The objects of one layer of the walker, each at its spot. */
function WalkerObjects({ look, objects, layer }: { readonly look: StageLook; readonly objects: readonly PlacedObject[]; readonly layer: WalkerLayer }) {
	return objects
		.filter((object) => WALKER_LAYER[object.spot] === layer)
		.map(({ id, spot }) => (
			<g key={id} transform={walkerAnchor(look, spot)}>
				<SkillObject id={id} />
			</g>
		));
}

/**
 * The walker of the road (home-header S6, M11 S1) at the stage the character has reached, its feet at
 * its origin, facing the gate: the same person as the plaque's bust, with the same objects. A tunic
 * and an ochre belt, short while he travels and to the ankles once he carries a case of scrolls,
 * dyed clavi from the apprentice on; what he wears over it; the satchel on its strap, or the capsa;
 * sandals; his hair and beard by age; and the staff, thicker from the traveller on, with the lantern
 * on its hook, lit at night. The open mantle's sash stirs in the wind. Bowed with the years, his head
 * leans forward and the staff, and its lantern, stand higher.
 */
export function WalkerFigure({ avatar }: { readonly avatar: AvatarView }) {
	const look = STAGE_LOOKS[avatar.stage];
	const objects = placedObjects(avatar.objects);
	const layer = (name: WalkerLayer) => <WalkerObjects look={look} objects={objects} layer={name} />;
	const sturdy = look.staff === 'sturdy';
	const longRobe = look.capsa === true;
	const tall = look.stoop ? -4 : 0;
	const staffTop = n(-62.6 + tall);
	const lampY = n(LAMP.y + tall);
	const head = (
		<>
			<circle className="dromos-scene-head" cx="0.6" cy="-57.8" r="6.6" />
			{WALKER_HAIR[look.hair]}
			{look.beard ? WALKER_BEARD[look.beard] : null}
			{look.hair === 'sage' || look.hair === 'thinning' ? (
				<path className={look.hair === 'sage' ? 'dromos-scene-white' : 'dromos-scene-grey'} d="M2.6 -59.6C3.6 -60.6 5.2 -60.8 6.2 -60.2 5.2 -59.8 4 -59.6 2.8 -59.2z" />
			) : null}
			<circle className="dromos-scene-eye" cx="4.2" cy="-57.4" r="0.8" />
			<path className="dromos-scene-fold" d="M7.1 -57.6L8 -55.4 6.8 -55" />
			{look.hat ? WALKER_HAT : null}
			{layer('head')}
		</>
	);
	return (
		<g className="dromos-scene-figure">
			<circle className="dromos-scene-lamp-glow" cx={LAMP.x} cy={lampY} r="10" />
			{layer('behind')}
			<path className={sturdy ? 'dromos-scene-staff is-sturdy' : 'dromos-scene-staff'} d={`M20 2V${staffTop}C20 ${n(staffTop - 4.4)} 25.6 ${n(staffTop - 5)} 25.6 ${n(staffTop - 1.6)}`} />
			{sturdy ? <path className="dromos-scene-fold" d="M19 -14.6H21M19 -30.4H21" /> : null}
			{layer('staff')}
			{/* Legs and sandals under the tunic's hem. */}
			<path className="dromos-scene-skin" d={longRobe ? 'M-5.6 -5.4L-5 -2.2H-2.2L-2 -5.4zM2.8 -5.4L3.2 -2.2H6L5.8 -5.4z' : 'M-5.4 -12L-5 -2.2H-2.2L-2 -12zM2.6 -12L3.2 -2.2H6L5.8 -12z'} />
			<path className="dromos-scene-skin" d="M-7.2 0H-0.2C-0.2 -1.4-1.2 -2.4-2.6 -2.4H-5.8C-6.8 -2.4-7.4 -1.2-7.2 0zM1.8 0H8.8C8.8 -1.4 7.8 -2.4 6.4 -2.4H3.2C2.2 -2.4 1.6 -1.2 1.8 0z" />
			<path
				className="dromos-scene-sandal"
				d={longRobe ? 'M-7.2 0H-0.2M1.8 0H8.8M-4.6 -2.4L-3.6 -1M3.6 -2.4L4.6 -1' : 'M-7.2 0H-0.2M1.8 0H8.8M-5.2 -5L-2.2 -3.6M-4.6 -2.4L-3.6 -1M2.8 -5L5.9 -3.6M3.6 -2.4L4.6 -1'}
			/>
			<path
				className="dromos-scene-robe"
				d={longRobe ? 'M-6.4 -49L6.4 -49C8.4 -38 10 -22 11.4 -4.6L-11.6 -4.6C-10.2 -22-8.4 -38-6.4 -49z' : 'M-6.4 -49L6.4 -49C8.4 -38 9.8 -24 11.2 -11.2L-11.4 -11.2C-10 -24-8.4 -38-6.4 -49z'}
			/>
			{look.clavi ? <path className="dromos-scene-clavus" d={`M3.6 -49H5.4C6.6 -38 7.8 -24 8.8 ${longRobe ? -4.6 : -11.2}H7C6 -24 4.8 -38 3.6 -49z`} /> : null}
			<path className="dromos-scene-fold" d={longRobe ? 'M-11 -7.4C-3.6 -6.4 3.8 -6.4 11 -7.4' : 'M-10.8 -14C-3.6 -13 3.8 -13 10.8 -14'} />
			<path className="dromos-scene-belt" d="M-2.6 -31.4L9.4 -31.8" />
			<WalkerGarment look={look} stage={avatar.stage} />
			{isOpenMantle(look.garment) ? SASH : null}
			{look.waterskin ? WATERSKIN : null}
			{/* The satchel's strap from the far shoulder, to the satchel at the front hip or the capsa higher up. */}
			<path className="dromos-scene-strap" d={`M-4.6 -50.2L${longRobe ? '6.6 -35.4' : '7.4 -30.6'}`} />
			{layer('body')}
			{layer('satchel')}
			{longRobe ? CAPSA : SATCHEL}
			{layer('arm')}
			{/* The near arm out of the mantle, its hand on the staff. */}
			<path className="dromos-scene-robe" d="M7.6 -45C10.8 -43 14.2 -41 17.8 -39.6L18.6 -42.2C15.2 -43.6 12 -45.8 9.4 -47.8z" />
			<circle className="dromos-scene-skin" cx="19.8" cy="-40.8" r="2" />
			{look.stoop ? <g transform="translate(1.2 1.4)">{head}</g> : head}
			{layer('front')}
			{/* The lantern on its ring: its glass, unlit by day, takes the lamp's light at night. */}
			<path className="dromos-scene-lantern" d={`M23.8 ${n(lampY - 3)}H27.4L27.8 ${n(lampY + 2.8)}H23.4zM23.4 ${n(lampY - 3)}L25.6 ${n(lampY - 5.2)} 27.8 ${n(lampY - 3)}z`} />
			<circle className="dromos-scene-lamp" cx={LAMP.x} cy={lampY} r="1.6" />
		</g>
	);
}
