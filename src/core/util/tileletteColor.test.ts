import { getTileletteColor } from './tileletteColor';

describe('getTileletteColor', () => {
	it('is stable for the same id', () => {
		expect(getTileletteColor('tilette-abc')).toEqual(getTileletteColor('tilette-abc'));
	});

	it('returns a valid RGB in 0–255 range', () => {
		const c = getTileletteColor('anything');
		for (const channel of [c.r, c.g, c.b]) {
			expect(channel).toBeGreaterThanOrEqual(0);
			expect(channel).toBeLessThanOrEqual(255);
		}
	});

	it('spreads different ids across more than one hue', () => {
		const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
		const unique = new Set(ids.map((id) => JSON.stringify(getTileletteColor(id))));
		expect(unique.size).toBeGreaterThan(1);
	});

	it('falls back to a color for null/undefined ids', () => {
		expect(getTileletteColor(null)).toEqual(getTileletteColor(undefined));
		expect(getTileletteColor(null)).toBeTruthy();
	});
});
