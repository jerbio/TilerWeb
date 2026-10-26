import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const trackExposure = vi.fn();
const getAnonymousId = vi.fn(() => 'anon-1');
const isAutomated = vi.fn(() => false);
const readOverride = vi.fn<() => string | null>(() => null);
const readPin = vi.fn<() => string | null>(() => null);

vi.mock('./exposure', () => ({ trackExposure: (...args: unknown[]) => trackExposure(...args) }));
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

import {
	EXPOSURE_DWELL_MS,
	EXPOSURE_VISIBILITY_RATIO,
	getHeroAssignment,
	resetHeroAssignment,
	useHeroExperiment,
} from './useExperiment';

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

let callbacks: ObserverCallback[] = [];
let disconnects = 0;

class FakeIntersectionObserver {
	constructor(cb: ObserverCallback) {
		callbacks.push(cb);
	}
	observe() {}
	unobserve() {}
	disconnect() {
		disconnects += 1;
	}
	takeRecords() {
		return [];
	}
}

const emit = (ratio: number) =>
	act(() => {
		callbacks.forEach((cb) =>
			cb([
				{
					isIntersecting: ratio > 0,
					intersectionRatio: ratio,
				} as IntersectionObserverEntry,
			])
		);
	});

beforeEach(() => {
	vi.useFakeTimers();
	callbacks = [];
	disconnects = 0;
	resetHeroAssignment();
	trackExposure.mockClear();
	isAutomated.mockReturnValue(false);
	readOverride.mockReturnValue(null);
	readPin.mockReturnValue(null);
	vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

/** Renders the hook and arms the gate, mirroring how the hero attaches its ref. */
const arm = () => {
	const view = renderHook(() => useHeroExperiment());
	act(() => view.result.current.ref(document.createElement('div')));
	return view;
};

describe('getHeroAssignment', () => {
	it('resolves once and returns the same assignment on every call', () => {
		const first = getHeroAssignment();
		const second = getHeroAssignment();

		expect(second).toBe(first);
		expect(getAnonymousId).toHaveBeenCalledTimes(1);
	});

	it('serves control and forces when the render is automated', () => {
		isAutomated.mockReturnValue(true);

		expect(getHeroAssignment()).toMatchObject({
			variant: 'control',
			source: 'automated',
			forced: true,
		});
	});

	it('honours a ?hero= override and marks it forced', () => {
		readOverride.mockReturnValue('self_healing');

		expect(getHeroAssignment()).toMatchObject({
			variant: 'self_healing',
			source: 'override',
			forced: true,
		});
	});

	it('prefers a pinned arm over the hash', () => {
		readPin.mockReturnValue('task_splitting');

		expect(getHeroAssignment()).toMatchObject({
			variant: 'task_splitting',
			source: 'pin',
			forced: false,
		});
	});
});

describe('useHeroExperiment', () => {
	it('does not report on mount alone', () => {
		arm();

		expect(trackExposure).not.toHaveBeenCalled();
	});

	it('does not report while the hero is below the visibility threshold', () => {
		arm();

		emit(EXPOSURE_VISIBILITY_RATIO - 0.01);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS * 2));

		expect(trackExposure).not.toHaveBeenCalled();
	});

	it('does not report before the dwell threshold elapses', () => {
		arm();

		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS - 1));

		expect(trackExposure).not.toHaveBeenCalled();
	});

	it('reports once the hero has been visible for the dwell period', () => {
		const view = arm();

		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS));

		expect(trackExposure).toHaveBeenCalledExactlyOnceWith(view.result.current.assignment);
	});

	it('cancels when the hero scrolls away before the dwell period completes', () => {
		arm();

		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS - 100));
		emit(0);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS * 2));

		expect(trackExposure).not.toHaveBeenCalled();
	});

	it('reports only once even if the hero re-enters the viewport', () => {
		arm();

		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS));
		emit(0);
		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS * 2));

		expect(trackExposure).toHaveBeenCalledTimes(1);
	});

	it('stops observing after reporting', () => {
		arm();

		emit(1);
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS));

		expect(disconnects).toBeGreaterThan(0);
	});

	it('does not report after unmount', () => {
		const view = arm();

		emit(1);
		view.unmount();
		act(() => void vi.advanceTimersByTime(EXPOSURE_DWELL_MS * 2));

		expect(trackExposure).not.toHaveBeenCalled();
	});

	it('renders without an IntersectionObserver rather than throwing', () => {
		vi.stubGlobal('IntersectionObserver', undefined);

		expect(() => arm()).not.toThrow();
		expect(trackExposure).not.toHaveBeenCalled();
	});
});
