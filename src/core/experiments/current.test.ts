import { describe, expect, it, vi, beforeEach } from 'vitest';

const getAnonymousId = vi.fn(() => 'anon-1');
const isAutomated = vi.fn(() => false);
const readOverride = vi.fn<() => string | null>(() => null);
const readPin = vi.fn<() => string | null>(() => null);

vi.mock('@/core/analytics/identity', () => ({ getAnonymousId: () => getAnonymousId() }));
vi.mock('./environment', async () => {
	const actual = await vi.importActual<typeof import('./environment')>('./environment');
	return {
		...actual,
		isAutomated: () => isAutomated(),
		readOverride: () => readOverride(),
		readPin: () => readPin(),
	};
});

import { getConversionExperiments, getHeroAssignment, resetHeroAssignment } from './current';

beforeEach(() => {
	resetHeroAssignment();
	isAutomated.mockReturnValue(false);
	readOverride.mockReturnValue(null);
	readPin.mockReturnValue(null);
	getAnonymousId.mockClear();
	getAnonymousId.mockReturnValue('anon-1');
});

describe('getConversionExperiments', () => {
	it('reports the visitor arm in the conversion envelope shape', () => {
		const assignment = getHeroAssignment();

		expect(getConversionExperiments()).toEqual([
			{ key: 'hero_v1', variant: assignment.variant, forced: false },
		]);
	});

	it('omits the arm entirely for an automated render', () => {
		isAutomated.mockReturnValue(true);

		// Reporting `control` here would let a prerender masquerade as a real visitor.
		expect(getConversionExperiments()).toBeUndefined();
	});

	it('flags a forced override so the server can exclude QA traffic', () => {
		readOverride.mockReturnValue('stop_deciding');

		expect(getConversionExperiments()).toEqual([
			{ key: 'hero_v1', variant: 'stop_deciding', forced: true },
		]);
	});

	it('returns undefined rather than throwing when identity is unavailable', () => {
		getAnonymousId.mockImplementation(() => {
			throw new Error('storage blocked');
		});

		expect(getConversionExperiments()).toBeUndefined();
	});

	it('resolves once and reuses the result across calls', () => {
		getConversionExperiments();
		getConversionExperiments();
		getConversionExperiments();

		expect(getAnonymousId).toHaveBeenCalledTimes(1);
	});

	it('never moves a visitor between arms within a page load', () => {
		const first = getConversionExperiments();
		readPin.mockReturnValue('task_splitting');
		const second = getConversionExperiments();

		expect(second).toEqual(first);
	});
});
