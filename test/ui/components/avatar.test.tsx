import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { STAGE_IDS, type StageId } from '../../../src/domain/character/Stage';
import { CharacterPortrait } from '../../../src/ui/atoms/Portrait';
import { Walker } from '../../../src/ui/atoms/Walker';
import { SKILL_OBJECT_SPOTS, type AvatarView } from '../../../src/ui/presenters/avatar';

// M11 S1 (L10): the figure's twelve stages, on the plaque's bust and on the road's walker, and one
// object per skill, ported from the approved mockups.
const portrait = (avatar: AvatarView): string => renderToStaticMarkup(<CharacterPortrait avatar={avatar} />);
const walker = (avatar: AvatarView): string =>
	renderToStaticMarkup(
		<svg>
			<Walker fraction={null} avatar={avatar} />
		</svg>,
	);
const bare = (stage: StageId): AvatarView => ({ stage, objects: [] });
const SKILLS = Object.keys(SKILL_OBJECT_SPOTS);

describe('The figure at each stage (M11 S1)', () => {
	it('names its stage on the bust and on the walker, and no two stages are drawn alike', () => {
		for (const stage of STAGE_IDS) {
			expect(portrait(bare(stage)), stage).toContain(`<g class="dromos-portrait-stage is-${stage}">`);
			expect(walker(bare(stage)), stage).toContain(`<g class="dromos-walker is-${stage}" transform=`);
		}
		expect(new Set(STAGE_IDS.map((stage) => portrait(bare(stage)))).size).toBe(STAGE_IDS.length);
		expect(new Set(STAGE_IDS.map((stage) => walker(bare(stage)))).size).toBe(STAGE_IDS.length);
	});

	it('frames the bust in the niche, decorative, with its own clip', () => {
		const html = portrait(bare('traveller'));
		const clip = /<clipPath id="([^"]+)">/.exec(html)?.[1];

		expect(html).toMatch(/^<svg class="dromos-portrait-art is-niche is-character" viewBox="0 0 100 124" aria-hidden="true" focusable="false">/);
		expect(html).toContain(`<g clip-path="url(#${clip})"><g transform="translate(-10 10) scale(1.2)"><g class="dromos-portrait-stage is-traveller">`);
		expect(html).not.toMatch(/<title|<text|aria-label|role=/);
	});

	it('ends the road as the sage of the first plaque: bald, his long white beard, his scroll', () => {
		const html = portrait(bare('sage'));

		expect(html).toContain('<path class="dromos-portrait-white" d="M37.6 45C37 53 38 61 41 68.6C43.6 75 46.6 80.6 50 86.6C53.4 80.6 56.4 75 59 68.6C62 61 63 53 62.4 45C60.2 50 56 52.6 50 52.8C44 52.6 39.8 50 37.6 45Z"></path>');
		expect(html).toContain('<rect class="dromos-portrait-scroll" x="9" y="88.2" width="36" height="7.6" rx="1.4"></rect>');
		expect(html).not.toContain('dromos-portrait-hair');
	});

	it('starts as the walker of the road: young, beardless, dark hair, his lantern on the staff', () => {
		const html = portrait(bare('runner'));

		expect(html).toContain('class="dromos-portrait-hair"');
		expect(html).toContain('class="dromos-portrait-lantern"');
		expect(html).toContain('class="dromos-portrait-glow"');
		expect(html).not.toMatch(/dromos-portrait-(white|grey|stubble)/);
	});
});

describe('The skill objects (M11 S1, L10)', () => {
	it('gives each of the fourteen skills its own object, drawn on the bust and on the walker', () => {
		expect(SKILLS).toHaveLength(14);
		for (const id of SKILLS) {
			const avatar = { stage: 'apprentice', objects: [id] } as const;
			for (const html of [portrait(avatar), walker(avatar)]) {
				expect(html, id).toMatch(new RegExp(`<g class="dromos-avatar-thing is-${id}"><(path|circle|rect|ellipse) `));
				expect(html.match(/dromos-avatar-thing/g), id).toHaveLength(1);
			}
		}
	});

	it('draws every object it is given, and nothing for a skill without one', () => {
		const html = portrait({ stage: 'mentor', objects: ['atleta', 'unknown', 'lector', 'cronista'] });

		expect([...html.matchAll(/dromos-avatar-thing is-(\w+)/g)].map((match) => match[1]).sort()).toEqual(['atleta', 'cronista', 'lector']);
		expect(portrait({ stage: 'mentor', objects: ['unknown'] })).toBe(portrait(bare('mentor')));
	});

	it('puts each object in its layer: the shield behind him, the wreath over his hair, a held object in his hand', () => {
		const html = portrait({ stage: 'runner', objects: ['centinela', 'atleta', 'cronista'] });
		const at = (part: string): number => html.indexOf(part);

		expect(at('is-centinela')).toBeLessThan(at('dromos-portrait-tunic'));
		expect(at('is-atleta')).toBeGreaterThan(at('dromos-portrait-hair'));
		expect(at('is-cronista')).toBeGreaterThan(at('dromos-portrait-glow'));
		expect(html).toContain('<g transform="translate(74 48.6)"><g transform="translate(-2.6 3.4)"><path class="dromos-portrait-himation"');
	});

	it('hangs a pendant on a cord behind the beard, lower as the beard grows', () => {
		expect(portrait({ stage: 'runner', objects: ['maestro'] })).toContain('<g transform="translate(50 79.4)"><path class="dromos-avatar-cord dromos-avatar-fine" d="M-6.4 -17.4L0 -4.6L6.4 -17.4"></path></g>');
		expect(portrait({ stage: 'sage', objects: ['reposo'] })).toContain('<g transform="translate(50 88)"><path class="dromos-avatar-cord dromos-avatar-fine" d="M-6.4 -26L0 -4.6L6.4 -26"></path></g>');
		expect(portrait(bare('runner'))).not.toContain('dromos-avatar-cord');
	});

	it('places the same object where each stage wears it', () => {
		expect(walker({ stage: 'traveller', objects: ['atleta'] })).toContain('<g transform="translate(1 -63.6) rotate(4) scale(0.36 0.3)"><g class="dromos-avatar-thing is-atleta">');
		expect(walker({ stage: 'student', objects: ['lector'] })).toContain('<g transform="translate(8.2 -35.6) rotate(10) scale(0.5)"><g class="dromos-avatar-thing is-lector">');
		expect(portrait({ stage: 'scholar', objects: ['desarrollador'] })).toContain('<g transform="translate(55.8 89.6) rotate(-8)"><g class="dromos-avatar-thing is-desarrollador">');
	});
});
