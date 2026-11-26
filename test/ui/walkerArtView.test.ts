import { describe, expect, it } from 'vitest';
import { NO_WALKER_ART, type WalkerArt } from '../../src/domain';
import { SKILL_OBJECT_SPOTS } from '../../src/ui/presenters/avatar';
import { HOUR_GRADES, PAINTED_OBJECT_IDS, gradeMatrix, walkerArtView, type HourGrade } from '../../src/ui/presenters/walkerArtView';

const art: WalkerArt = {
	stages: { runner: 'app://v/walker-runner.webp', sage: 'app://v/walker-sage.webp' },
	objects: { centinela: 'app://v/object-centinela.webp', maestro: 'app://v/object-maestro.webp', atleta: 'app://v/object-atleta.webp' },
};

describe('walkerArtView: the painted walker of the avatar\'s stage (landscape-art S9)', () => {
	it('gives the stage\'s painting and the paintings of the objects the avatar carries, and leaves the others drawn', () => {
		expect(walkerArtView(art, { stage: 'runner', objects: ['centinela', 'lector', 'maestro'] })).toEqual({
			src: 'app://v/walker-runner.webp',
			objects: { centinela: 'app://v/object-centinela.webp', maestro: 'app://v/object-maestro.webp' },
		});
		expect(walkerArtView(art, { stage: 'sage', objects: [] })).toEqual({ src: 'app://v/walker-sage.webp', objects: {} });
	});

	it('gives nothing for a stage without its painting, whose walker stays drawn, objects included', () => {
		expect(walkerArtView(art, { stage: 'mentor', objects: ['centinela'] })).toBeNull();
		expect(walkerArtView(NO_WALKER_ART, { stage: 'runner', objects: ['centinela'] })).toBeNull();
	});

	it('looks for a painting of every skill that gives an object', () => {
		expect([...PAINTED_OBJECT_IDS].sort()).toEqual(Object.keys(SKILL_OBJECT_SPOTS).sort());
		expect(PAINTED_OBJECT_IDS).toHaveLength(14);
	});
});

/** The offline grade of the pilot (scratch tint.py, with Pillow): saturation, then brightness, then the multiply blend. */
function pilotGrade(grade: HourGrade, [r, g, b]: readonly [number, number, number]): number[] {
	const luma = 0.299 * r + 0.587 * g + 0.114 * b;
	return [r, g, b].map((value, channel) => {
		const saturated = luma + grade.saturation * (value - luma);
		const bright = saturated * grade.brightness;
		const multiplied = (bright * (grade.color[channel] ?? 255)) / 255;
		return bright + grade.amount * (multiplied - bright);
	});
}

/** A colour (0-255) through an feColorMatrix's values. */
function applyMatrix(values: string, rgb: readonly [number, number, number]): number[] {
	const m = values.split(' ').map(Number);
	expect(m).toHaveLength(20);
	return [0, 1, 2].map((row) => ((m[row * 5] ?? 0) * rgb[0] + (m[row * 5 + 1] ?? 0) * rgb[1] + (m[row * 5 + 2] ?? 0) * rgb[2]) + (m[row * 5 + 4] ?? 0) * 255);
}

describe('The light of the hour over the painted walker (landscape-art S9)', () => {
	it('grades dawn, dusk and night as the pilot did offline, and the day as painted', () => {
		expect(HOUR_GRADES).toEqual({
			dawn: { color: [255, 214, 222], amount: 0.55, saturation: 0.95, brightness: 1 },
			dusk: { color: [255, 196, 140], amount: 0.6, saturation: 1.05, brightness: 0.98 },
			night: { color: [120, 138, 196], amount: 0.85, saturation: 0.7, brightness: 0.8 },
		});
	});

	it('folds each grade into one colour matrix that gives the pilot\'s colours', () => {
		const samples = [
			[255, 255, 255],
			[200, 120, 60],
			[30, 90, 160],
			[128, 128, 128],
			[12, 8, 4],
		] as const;
		for (const [hour, grade] of Object.entries(HOUR_GRADES)) {
			const values = gradeMatrix(grade);
			expect(values, hour).toMatch(/ 0 0 0 1 0$/);
			for (const sample of samples) {
				const ours = applyMatrix(values, sample);
				const pilot = pilotGrade(grade, sample);
				ours.forEach((value, channel) => expect(Math.abs(value - (pilot[channel] ?? 0)), `${hour} ${sample.join(',')} channel ${channel}`).toBeLessThan(0.5));
			}
		}
	});
});
