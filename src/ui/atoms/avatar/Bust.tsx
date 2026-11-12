import type { AvatarView } from '../../presenters/avatar';
import { BUST_LAYER, bustAnchor, bustNeckY, type BustLayer } from './anchors';
import { BustBody, BustRightHand, BustStaff, BustStrap, HoldingHand } from './BustBody';
import { BUST_HAT, BustHead } from './BustHead';
import { n, STAGE_LOOKS, type StageLook } from './looks';
import { placedObjects, SkillObject, type PlacedObject } from './SkillObject';

/** The objects of one layer of the bust, each at its spot; a held object comes with the hand that holds it. */
function BustObjects({ look, objects, layer }: { readonly look: StageLook; readonly objects: readonly PlacedObject[]; readonly layer: BustLayer }) {
	return objects
		.filter((object) => BUST_LAYER[object.spot] === layer)
		.map(({ id, spot }) => (
			<g key={id} transform={bustAnchor(look, spot)}>
				{spot === 'hand' ? (
					<HoldingHand>
						<SkillObject id={id} />
					</HoldingHand>
				) : (
					<SkillObject id={id} />
				)}
			</g>
		));
}

/** The cord a pendant hangs from, drawn behind the beard, from the neck down to the pendant. */
function PendantCord({ look }: { readonly look: StageLook }) {
	const y = bustNeckY(look);
	const drop = n(62 - y);
	return (
		<g transform={`translate(50 ${y})`}>
			<path className="dromos-avatar-cord dromos-avatar-fine" d={`M-6.4 ${drop}L0 -4.6L6.4 ${drop}`} />
		</g>
	);
}

/**
 * The character on the plaque (M11 S1), a painted panel portrait of the era facing whoever looks, in
 * a 100-unit box with his shoulders at the bottom, at the stage he has reached: the same face from
 * the young runner to the sage, the years in his hair, beard and clothes, his staff and its lantern
 * beside him, and the objects of his highest skills, each at its spot and in its layer (behind him,
 * under or over the strap, at his neck, on his head, in his hands, pinned in front). He names nobody.
 */
export function Bust({ avatar }: { readonly avatar: AvatarView }) {
	const look = STAGE_LOOKS[avatar.stage];
	const objects = placedObjects(avatar.objects);
	const held = look.hand === 'staff';
	const layer = (name: BustLayer) => <BustObjects look={look} objects={objects} layer={name} />;
	return (
		<g className={`dromos-portrait-stage is-${avatar.stage}`}>
			{layer('behind')}
			{held ? null : <BustStaff look={look} />}
			{held ? null : layer('staff')}
			<BustBody look={look} />
			{layer('understrap')}
			<BustStrap look={look} />
			{layer('body')}
			{objects.some((object) => object.spot === 'neck') ? <PendantCord look={look} /> : null}
			<BustHead look={look} />
			{look.hat ? BUST_HAT : null}
			{layer('pendant')}
			{layer('head')}
			{held ? <BustStaff look={look} /> : null}
			{held ? layer('staff') : null}
			<BustRightHand look={look} />
			{layer('hand')}
			{layer('front')}
		</g>
	);
}
