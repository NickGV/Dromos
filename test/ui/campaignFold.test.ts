import { describe, expect, it } from 'vitest';
import { OPEN_CAMPAIGNS_KEY, storedOpenCampaigns, toggleCampaign } from '../../src/ui/containers/campaignFold';
import { InMemoryDeviceStore } from '../fakes/InMemoryDeviceStore';

// home-fit S1: which campaign cards of home are open is remembered on this device.
describe('the open campaign cards of home, on this device', () => {
	it('starts with every card folded', () => {
		expect([...storedOpenCampaigns(new InMemoryDeviceStore())]).toEqual([]);
	});

	it('opens a card, keeping the open ones under home-campaigns-open', () => {
		const store = new InMemoryDeviceStore();

		const open = toggleCampaign(store, new Set(), 'P/Kairos/README.md');

		expect(OPEN_CAMPAIGNS_KEY).toBe('home-campaigns-open');
		expect([...open]).toEqual(['P/Kairos/README.md']);
		expect(store.writes).toEqual([['home-campaigns-open', ['P/Kairos/README.md']]]);
	});

	it('folds an open card and keeps the others open', () => {
		const store = new InMemoryDeviceStore();

		const open = toggleCampaign(store, new Set(['a.md', 'b.md']), 'a.md');

		expect([...open]).toEqual(['b.md']);
		expect(store.writes).toEqual([['home-campaigns-open', ['b.md']]]);
	});

	it('restores the open cards this device kept', () => {
		const store = new InMemoryDeviceStore();
		toggleCampaign(store, toggleCampaign(store, new Set(), 'a.md'), 'b.md');

		expect([...storedOpenCampaigns(store)]).toEqual(['a.md', 'b.md']);
	});

	it('ignores a stored value that is not a list of paths, and the entries of a list that are not', () => {
		for (const value of ['a.md', 42, { 'a.md': true }, true]) {
			expect([...storedOpenCampaigns(new InMemoryDeviceStore({ 'home-campaigns-open': value }))]).toEqual([]);
		}
		expect([...storedOpenCampaigns(new InMemoryDeviceStore({ 'home-campaigns-open': ['a.md', 7, null, '', 'b.md'] }))]).toEqual(['a.md', 'b.md']);
	});
});
