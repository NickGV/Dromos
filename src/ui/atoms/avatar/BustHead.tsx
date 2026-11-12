import type { ReactNode } from 'react';
import { n, type Hair, type StageLook } from './looks';

/** The face, the same young face at every stage, facing whoever looks. */
const FACE = 'M36.6 40C36.6 28.4 42.4 21.4 50 21.4S63.4 28.4 63.4 40C63.4 50 58 59 50 59S36.6 50 36.6 40Z';

/**
 * The young man's hair by stage: a dark cap of short hair, then longer from the road, combed when he
 * tidies himself, neat, grey at the temples, and at last thin and grey over the ears.
 */
const BUST_HAIR: Readonly<Record<Exclude<Hair, 'sage'>, ReactNode>> = {
	young: (
		<>
			<path
				className="dromos-portrait-hair"
				d="M36.2 40C34.2 31.4 37 22.8 43.6 19.6C48.4 17.4 54.6 17.6 58.8 20.4C63.8 23.6 65.8 31 63.8 40C63 36.2 61.8 33.2 59.8 31C58 32.4 55.4 32.8 53 32C50.8 33.4 47.8 33.6 45.2 32.6C43.4 33.4 41.8 33.4 40.6 33C39 35 38 37.4 37.8 40Z"
			/>
			<path className="dromos-portrait-hair" d="M49.4 18.6C49.8 16.2 52.6 15.2 54.8 16.6 53.2 16.8 52.2 17.6 52 18.8Z" />
		</>
	),
	long: (
		<>
			<path
				className="dromos-portrait-hair"
				d="M36.4 47.6C33.2 41 33.4 30 38.6 23.6C42.6 18.8 48.6 17.2 54 17.8C60.4 18.6 65.2 23.4 66.2 30.4C66.8 35.6 65.8 42 63.6 47.6C63 42 62.6 37 61 33.2C59.4 30.6 57 29.6 55.2 30.4C53.6 31.8 51.4 32.4 49 31.8C46.4 32.8 43.6 32.8 41.6 31.8C39.6 34.4 38.4 38.6 38.2 43Z"
			/>
			<path className="dromos-portrait-hair" d="M48.6 18C48.8 15.2 51.8 13.8 54.4 15.2 52.6 15.6 51.6 16.6 51.4 18Z" />
		</>
	),
	combed: (
		<>
			<path
				className="dromos-portrait-hair"
				d="M36.2 39.4C34.4 30.6 37.6 22.2 44.6 19.6C49.4 17.8 55 18 59 20.6C63.8 23.8 65.6 31 63.8 39.4C63.2 35.6 62 32.6 60.2 30.8C55.4 30.6 50.2 29.4 46.2 26.8C44.2 29.2 41.6 31 39.8 32C38.6 34.2 37.8 36.8 37.6 39.4Z"
			/>
			<path className="dromos-portrait-lock" d="M46.2 26.8C50 25.8 55.6 26.4 60.2 30.8M46.2 22.6C51 22 56.4 23.4 60.4 26.4" />
		</>
	),
	neat: (
		<>
			<path
				className="dromos-portrait-hair"
				d="M36.4 38.6C34.8 30.4 38 22.6 44.6 20C49.4 18.2 55 18.4 59 21C63.6 24 65.4 30.6 63.6 38.6C63 35 61.8 32.4 60 30.6C55.4 30.4 50.6 29.6 46.8 27.6C44.6 29.6 42 31.2 40.2 32.2C38.8 34 37.8 36.2 37.6 38.6Z"
			/>
			<path className="dromos-portrait-lock" d="M46.8 27.6C50.6 26.6 55.8 27.2 60 30.6" />
		</>
	),
	temples: (
		<>
			<path
				className="dromos-portrait-hair"
				d="M36.4 38.6C34.8 30.4 38 22.6 44.6 20C49.4 18.2 55 18.4 59 21C63.6 24 65.4 30.6 63.6 38.6C63 35 61.8 32.4 60 30.6C55.4 30.4 50.6 29.6 46.8 27.6C44.6 29.6 42 31.2 40.2 32.2C38.8 34 37.8 36.2 37.6 38.6Z"
			/>
			<path
				className="dromos-portrait-grey"
				d="M36.4 38.6C35.6 34.6 35.8 30.8 37.4 27.6C38.6 29.4 39.4 30.8 40.2 32.2C38.8 34 37.8 36.2 37.6 38.6ZM63.6 38.6C64.4 34.6 64.2 30.8 62.6 27.6C61.6 28.8 60.8 29.8 60 30.6C61.8 32.4 63 35 63.6 38.6Z"
			/>
			<path className="dromos-portrait-lock" d="M46.8 27.6C50.6 26.6 55.8 27.2 60 30.6" />
		</>
	),
	thinning: (
		<>
			<path className="dromos-portrait-grey" d="M37.6 33.4C33.4 34.8 31.8 39.4 32.4 44C32.8 47.6 34.6 50.2 37.6 51.4L39 44.8C38.2 41 37.8 37.2 37.6 33.4Z" />
			<path className="dromos-portrait-grey" d="M62.4 33.4C66.6 34.8 68.2 39.4 67.6 44C67.2 47.6 65.4 50.2 62.4 51.4L61 44.8C61.8 41 62.2 37.2 62.4 33.4Z" />
			<path className="dromos-portrait-grey" d="M45 22.6C46.6 19.4 51 18.8 53.8 20.6C51.4 20.8 49.4 21.6 48.2 23.4C47 22.8 46 22.6 45 22.6Z" />
			<path className="dromos-portrait-lock" d="M34.6 40.2C34.8 44 35.8 47.2 37.6 49.6M65.4 40.2C65.2 44 64.2 47.2 62.4 49.6" />
		</>
	),
};

/** The ears, hidden under the old man's grey hair. */
const EARS = (
	<>
		<path className="dromos-portrait-skin" d="M37.4 37.6C34.6 36.4 33 38.6 33.4 41.6C33.8 44.6 35.6 46.4 37.8 46Z" />
		<path className="dromos-portrait-skin" d="M62.6 37.6C65.4 36.4 67 38.6 66.6 41.6C66.2 44.6 64.4 46.4 62.2 46Z" />
		<path className="dromos-portrait-fold" d="M35.6 39.4C35 41 35.4 43 36.6 44.2M64.4 39.4C65 41 64.6 43 63.4 44.2" />
	</>
);

/** The kind eyes, the same at every age. */
const EYES = (
	<>
		<circle className="dromos-portrait-eye" cx="44.2" cy="40.2" r="1.25" />
		<circle className="dromos-portrait-eye" cx="55.8" cy="40.2" r="1.25" />
	</>
);

/** Brows and lids: dark brows while young, grey at the temples, then grey brows over tired lids. */
function Eyes({ hair }: { readonly hair: Hair }) {
	if (hair === 'thinning') {
		return (
			<>
				<path className="dromos-portrait-grey" d="M40.4 36.6C42.4 34.6 45.4 34.4 47.6 35.8C45.4 36.2 43 36.8 40.6 37.8Z" />
				<path className="dromos-portrait-grey" d="M59.6 36.6C57.6 34.6 54.6 34.4 52.4 35.8C54.6 36.2 57 36.8 59.4 37.8Z" />
				<path className="dromos-portrait-lid" d="M42.2 39.4Q44.2 38.2 46.2 39.4M53.8 39.4Q55.8 38.2 57.8 39.4" />
				{EYES}
				<path className="dromos-portrait-crease" d="M41 42.4L40 43.4M59 42.4L60 43.4" />
			</>
		);
	}
	return (
		<>
			<path className={hair === 'temples' ? 'dromos-portrait-brow is-grey' : 'dromos-portrait-brow'} d="M41.4 36.4Q44.2 34.6 47 35.8M53 35.8Q55.8 34.6 58.6 36.4" />
			{EYES}
		</>
	);
}

/** The smile of the beardless young man, under the nose. */
const YOUNG_SMILE = <path className="dromos-portrait-smile" d="M46.8 50.8Q50 52.8 53.2 50.8" />;

/** The lips that show through a beard, at a height. */
function Lips({ y }: { readonly y: number }) {
	return <path className="dromos-portrait-skin" d={`M46.6 ${y}Q50 ${n(y + 3)} 53.4 ${y}Q50 ${n(y + 1.2)} 46.6 ${y}Z`} />;
}

/** The moustache over the lips, dark or grey. */
function Moustache({ className }: { readonly className: string }) {
	return (
		<path
			className={className}
			d="M50 47.6C46.6 46.6 43.4 47.8 41.8 50.8C44.4 50.4 47.2 50.2 50 50.4C52.8 50.2 55.6 50.4 58.2 50.8C56.6 47.8 53.4 46.6 50 47.6Z"
		/>
	);
}

/** The beard by stage, the smile in it: the first down, short, trimmed, full, greying, long and grey. */
function Beard({ beard }: { readonly beard: StageLook['beard'] }) {
	switch (beard) {
		case null:
			return YOUNG_SMILE;
		case 'down':
			return (
				<>
					<path
						className="dromos-portrait-stubble"
						d="M38.2 46.4C39.4 52.4 43.4 57.4 48 58.6C49.4 58.9 50.6 58.9 52 58.6C56.6 57.4 60.6 52.4 61.8 46.4C60.4 49.4 58.4 51.6 56.4 52.6C54.6 51.8 52.4 51.4 50 51.4S45.4 51.8 43.6 52.6C41.6 51.6 39.6 49.4 38.2 46.4Z"
					/>
					<path className="dromos-portrait-stubble" d="M50 48.4C47.6 47.8 45.2 48.4 44.2 49.8C46.2 49.6 48 49.6 50 49.8C52 49.6 53.8 49.6 55.8 49.8C54.8 48.4 52.4 47.8 50 48.4Z" />
					{YOUNG_SMILE}
				</>
			);
		case 'short':
			return (
				<>
					<path
						className="dromos-portrait-hair"
						d="M37.2 43.4C37.4 50.6 41 57.6 46.4 59.8C47.6 60.4 48.8 60.6 50 60.6S52.4 60.4 53.6 59.8C59 57.6 62.6 50.6 62.8 43.4C61.6 47.4 59.8 50.6 57.6 52.4C55.6 51.2 52.8 50.6 50 50.6S44.4 51.2 42.4 52.4C40.2 50.6 38.4 47.4 37.2 43.4Z"
					/>
					<Moustache className="dromos-portrait-hair" />
					<Lips y={51.4} />
				</>
			);
		case 'trimmed':
			return (
				<>
					<path
						className="dromos-portrait-hair"
						d="M37 43C37 51.6 40.6 59.6 46 62.6C47.4 63.4 48.6 63.8 50 63.8S52.6 63.4 54 62.6C59.4 59.6 63 51.6 63 43C61.8 47.4 59.8 50.8 57.6 52.6C55.6 51.4 52.8 50.8 50 50.8S44.4 51.4 42.4 52.6C40.2 50.8 38.2 47.4 37 43Z"
					/>
					<Moustache className="dromos-portrait-hair" />
					<Lips y={51.6} />
				</>
			);
		case 'full':
		case 'full-grey':
			return (
				<>
					<path
						className="dromos-portrait-hair"
						d="M36.8 42.4C36.4 51.6 38.4 60.6 43.2 66.4C45.4 69 47.6 70.4 50 70.4S54.6 69 56.8 66.4C61.6 60.6 63.6 51.6 63.2 42.4C61.6 47.6 59.2 51 57.4 52.6C55.4 51.4 52.8 50.8 50 50.8S44.6 51.4 42.6 52.6C40.8 51 38.4 47.6 36.8 42.4Z"
					/>
					{beard === 'full-grey' ? (
						<>
							<path
								className="dromos-portrait-grey"
								d="M36.8 42.4C36.6 46.8 37.1 50.6 38.2 54.2L41.6 52.6C39.8 50.2 38.2 46.8 36.8 42.4ZM63.2 42.4C63.4 46.8 62.9 50.6 61.8 54.2L58.4 52.6C60.2 50.2 61.8 46.8 63.2 42.4Z"
							/>
							<path className="dromos-portrait-grey" d="M49 60.4C49.2 63 49.5 65.4 50 67.4C50.5 65.4 50.8 63 51 60.4C50.3 60.8 49.7 60.8 49 60.4Z" />
						</>
					) : (
						<path className="dromos-portrait-lock" d="M44.6 56C45.4 60.6 47 64.4 48.8 67.2M55.4 56C54.6 60.6 53 64.4 51.2 67.2" />
					)}
					<Moustache className="dromos-portrait-hair" />
					<Lips y={51.6} />
				</>
			);
		case 'grey':
			return (
				<>
					<path
						className="dromos-portrait-grey"
						d="M37.4 44.6C36.6 53 37.8 61.4 41 68.2C43.4 73.4 46.4 77.6 50 80.6C53.6 77.6 56.6 73.4 59 68.2C62.2 61.4 63.4 53 62.6 44.6C60.6 49.6 56.6 52.4 50 52.6C43.4 52.4 39.4 49.6 37.4 44.6Z"
					/>
					<path className="dromos-portrait-lock" d="M44 57C44.6 64 46.4 70.6 48.6 75.6M56 57C55.4 64 53.6 70.6 51.4 75.6M50 55.6V78" />
					<Moustache className="dromos-portrait-grey" />
					<path className="dromos-portrait-smile" d="M47.6 53.2Q50 54.6 52.4 53.2" />
				</>
			);
		case 'white':
			return null;
	}
}

/** The creases of the brow, one or two with the years. */
function Creases({ count }: { readonly count: StageLook['creases'] }) {
	if (!count) return null;
	return count === 1 ? (
		<path className="dromos-portrait-crease" d="M44.8 29.4Q50 28 55.2 29.4" />
	) : (
		<path className="dromos-portrait-crease" d="M44.2 27.6Q50 26 55.8 27.6M45.4 30.6Q50 29.4 54.6 30.6" />
	);
}

/**
 * The sage's head, the plaque's first portrait (M11 L5): a high bald brow with two creases, white
 * hair at the temples, kind eyes under white brows and tired lids, a smile in a long white beard.
 */
const SAGE_HEAD = (
	<>
		<path className="dromos-portrait-skin" d={FACE} />
		<path className="dromos-portrait-white" d="M37.6 34.2C33.6 35.4 31.4 39.6 31.8 44.4C32.2 48.6 34.4 51.8 37.6 53.2L39.4 45.6C38.2 42 37.8 38 37.6 34.2Z" />
		<path className="dromos-portrait-white" d="M62.4 34.2C66.4 35.4 68.6 39.6 68.2 44.4C67.8 48.6 65.6 51.8 62.4 53.2L60.6 45.6C61.8 42 62.2 38 62.4 34.2Z" />
		<path className="dromos-portrait-lock" d="M34.4 40.2C34.6 44 35.6 47.2 37.4 49.6M65.6 40.2C65.4 44 64.4 47.2 62.6 49.6" />
		<path className="dromos-portrait-crease" d="M44.2 27.6Q50 26 55.8 27.6M45.4 30.6Q50 29.4 54.6 30.6" />
		<circle className="dromos-portrait-cheek" cx="42.4" cy="45.4" r="3" />
		<circle className="dromos-portrait-cheek" cx="57.6" cy="45.4" r="3" />
		<path
			className="dromos-portrait-white"
			d="M37.6 45C37 53 38 61 41 68.6C43.6 75 46.6 80.6 50 86.6C53.4 80.6 56.4 75 59 68.6C62 61 63 53 62.4 45C60.2 50 56 52.6 50 52.8C44 52.6 39.8 50 37.6 45Z"
		/>
		<path className="dromos-portrait-lock" d="M44.2 57C44.6 65 46.2 73 48.4 80M55.8 57C55.4 65 53.8 73 51.6 80M50 55.6V84" />
		<path
			className="dromos-portrait-white"
			d="M50 47.4C46.4 46.4 42.6 47.8 40.6 51.4C43.6 50.8 46.8 50.4 50 50.6C53.2 50.4 56.4 50.8 59.4 51.4C57.4 47.8 53.6 46.4 50 47.4Z"
		/>
		<path className="dromos-portrait-smile" d="M47.6 53.2Q50 54.6 52.4 53.2" />
		<path className="dromos-portrait-white" d="M40.4 36.6C42.4 34.4 45.4 34.2 47.6 35.6C45.4 36 43 36.6 40.6 37.8Z" />
		<path className="dromos-portrait-white" d="M59.6 36.6C57.6 34.4 54.6 34.2 52.4 35.6C54.6 36 57 36.6 59.4 37.8Z" />
		<path className="dromos-portrait-lid" d="M42.2 39.4Q44.2 38.2 46.2 39.4M53.8 39.4Q55.8 38.2 57.8 39.4" />
		{EYES}
		<path className="dromos-portrait-crease" d="M41 42.4L40 43.4M59 42.4L60 43.4" />
		<path className="dromos-portrait-fold" d="M50 39.6V46.2L51.8 46.8" />
	</>
);

/**
 * The bust's head at its stage, facing whoever looks: the ears, the face, the hair, the creases of
 * the brow, rosy cheeks, the beard and its smile, the eyes and the nose. At the last stage it is the
 * sage's head.
 */
export function BustHead({ look }: { readonly look: StageLook }) {
	const hair = look.hair;
	if (hair === 'sage') return SAGE_HEAD;
	return (
		<>
			{hair === 'thinning' ? null : EARS}
			<path className="dromos-portrait-skin" d={FACE} />
			{BUST_HAIR[hair]}
			<Creases count={look.creases} />
			<circle className="dromos-portrait-cheek" cx="42.4" cy="45.4" r="3" />
			<circle className="dromos-portrait-cheek" cx="57.6" cy="45.4" r="3" />
			<Beard beard={look.beard} />
			<Eyes hair={hair} />
			<path className="dromos-portrait-fold" d="M50 39.6V46.2L51.8 46.8" />
		</>
	);
}

/** The traveller's petasos, a wide felt hat with a leather band, and the hair under its brim. */
export const BUST_HAT = (
	<>
		<path className="dromos-portrait-hair" d="M36.4 40C35.2 36 35.4 32.6 36.6 30H42C40 32.6 38.6 36 37.8 40Z" />
		<path className="dromos-portrait-hair" d="M63.6 40C64.8 36 64.6 32.6 63.4 30H58C60 32.6 61.4 36 62.2 40Z" />
		<path className="dromos-portrait-felt" d="M23.6 29.6C25.4 24.4 36 21.4 50 21.4S74.6 24.4 76.4 29.6C74 31.6 63 32.2 50 32.2S26 31.6 23.6 29.6Z" />
		<path className="dromos-portrait-felt" d="M38.6 25.4C38.6 16.6 43.4 11.4 50 11.4S61.4 16.6 61.4 25.4C58 26.6 54 27 50 27S42 26.6 38.6 25.4Z" />
		<path className="dromos-portrait-band" d="M38.8 23.2C42 24.4 46 24.8 50 24.8S58 24.4 61.2 23.2" />
	</>
);
