import { describe, expect, it } from 'vitest';
import { completedCampaignCount, effectiveSkills } from '../../../src/domain/campaign/skillEvidence';
import { campaign, task } from './campaignFixtures';

describe('completedCampaignCount: campaigns that count toward an unlock', () => {
	it('counts completed campaigns whose skills include the id', () => {
		const campaigns = [
			campaign({ status: 'completed', skills: ['desarrollador'] }),
			campaign({ status: 'completed', skills: ['exegeta', 'estudiante'] }),
			campaign({ status: 'completed', skills: [] }),
			campaign({ status: 'active', skills: ['exegeta'] }),
		];

		expect(completedCampaignCount(campaigns, 'exegeta')).toBe(1);
		expect(completedCampaignCount(campaigns, 'estudiante')).toBe(1);
		expect(completedCampaignCount(campaigns, 'lector')).toBe(0);
	});
});

describe('effectiveSkills: the campaign gives its skills to the tasks that declare none', () => {
	const kairos = campaign({ skills: ['desarrollador'] });

	it('uses the task skills when it has any', () => {
		expect(effectiveSkills(kairos, task('a', null, { skills: ['diseñador'] }))).toEqual(['diseñador']);
	});

	it('falls back to the campaign skills', () => {
		expect(effectiveSkills(kairos, task('a', null))).toEqual(['desarrollador']);
	});

	it('is empty when neither declares one', () => {
		expect(effectiveSkills(campaign(), task('a', null))).toEqual([]);
	});
});
