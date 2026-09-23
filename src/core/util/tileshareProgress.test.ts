import { TileletteStatus, TileShareTemplate } from '@/core/common/types/tileshare';
import { computeClusterProgress, deriveTileletteStatus } from './tileshareProgress';

function makeTilette(id: string): TileShareTemplate {
	return {
		id,
		name: `Tilette ${id}`,
		creator: null,
		designatedUsers: null,
		clusterId: 'cluster-1',
		duration: null,
		start: null,
		end: null,
		miscData: null,
	};
}

describe('deriveTileletteStatus', () => {
	it('returns InProgress while the backend completion field is unavailable', () => {
		expect(deriveTileletteStatus(makeTilette('a'))).toBe(TileletteStatus.InProgress);
	});
});

describe('computeClusterProgress', () => {
	it('returns 0 for a null list', () => {
		expect(computeClusterProgress(null)).toBe(0);
	});

	it('returns 0 for an empty list', () => {
		expect(computeClusterProgress([])).toBe(0);
	});

	it('returns 0 when every tilette is in progress (current stub behaviour)', () => {
		expect(computeClusterProgress([makeTilette('a'), makeTilette('b')])).toBe(0);
	});

	it('returns 100 when every tilette is completed', () => {
		const tilettes = [makeTilette('a'), makeTilette('b')];
		expect(computeClusterProgress(tilettes, () => TileletteStatus.Completed)).toBe(100);
	});

	it('rounds a mixed set to the nearest whole percent', () => {
		const tilettes = [makeTilette('a'), makeTilette('b'), makeTilette('c')];
		// 1 of 3 completed -> 33.33 -> 33
		const resolve = (t: TileShareTemplate) =>
			t.id === 'a' ? TileletteStatus.Completed : TileletteStatus.InProgress;
		expect(computeClusterProgress(tilettes, resolve)).toBe(33);
	});
});
