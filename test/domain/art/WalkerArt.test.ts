import { describe, expect, it } from 'vitest';
import { NO_SCENE_ART, NO_WALKER_ART, sceneArtFrom, walkerArtFrom } from '../../../src/domain';

const file = (name: string) => ({ name, url: `app://vault/Dromos/Arte/${name}` });
const url = (name: string) => `app://vault/Dromos/Arte/${name}`;
const OBJECTS = ['atleta', 'centinela', 'lector'];

describe('walkerArtFrom: the painted walker in the art folder (landscape-art S9)', () => {
	it('finds each stage\'s walker-<stage> and each skill\'s object-<skill> by the paintings\' rules: webp, then png, then jpg, names in any case', () => {
		const art = walkerArtFrom(
			[
				file('walker-runner.png'),
				file('walker-runner.webp'),
				file('Walker-Sage.JPG'),
				file('walker-elder.jpeg'),
				file('object-atleta.jpg'),
				file('object-atleta.png'),
				file('OBJECT-Centinela.WEBP'),
			],
			OBJECTS,
		);

		expect(art).toEqual({
			stages: { runner: url('walker-runner.webp'), sage: url('Walker-Sage.JPG'), elder: url('walker-elder.jpeg') },
			objects: { atleta: url('object-atleta.png'), centinela: url('OBJECT-Centinela.WEBP') },
		});
	});

	it('ignores other stages, other skills, other formats and other names', () => {
		const art = walkerArtFrom(
			[file('walker-nobody.webp'), file('object-unknown.png'), file('walker-runner.gif'), file('object-lector.webm'), file('walker-runner copy.webp'), file('walker.webp'), file('runner.webp')],
			OBJECTS,
		);

		expect(art).toEqual(NO_WALKER_ART);
		expect(walkerArtFrom([], OBJECTS)).toEqual({ stages: {}, objects: {} });
	});

	it('finds only the objects it is asked for', () => {
		expect(walkerArtFrom([file('object-maestro.webp'), file('object-lector.webp')], OBJECTS).objects).toEqual({ lector: url('object-lector.webp') });
	});

	it('leaves the scenes\' paintings to sceneArtFrom, which ignores the walker\'s files', () => {
		expect(sceneArtFrom([file('walker-runner.webp'), file('object-atleta.webp')])).toEqual(NO_SCENE_ART);
	});
});
