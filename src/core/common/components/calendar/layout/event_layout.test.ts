import { describe, it, expect } from 'vitest';
import { computeStaggerLayout } from './event_layout';
import type { LayoutEvent, StaggerLayoutOptions } from './event_layout.types';

const OPTIONS: StaggerLayoutOptions = {
	staggerIncrement: 8,
	maxStaggerRatio: 0.4,
	minEventHeight: 30,
};

function makeEvent(overrides: Partial<LayoutEvent> & { id: string }): LayoutEvent {
	return { start: 1000, end: 2000, y: 0, height: 60, x: 0, width: 200, ...overrides };
}

describe('computeStaggerLayout', () => {
	it('returns empty array for empty input', () => {
		expect(computeStaggerLayout([], OPTIONS)).toEqual([]);
	});

	it('returns a result for every input event', () => {
		const events = [
			makeEvent({ id: 'a', start: 1000, end: 2000 }),
			makeEvent({ id: 'b', start: 3000, end: 4000 }),
		];
		expect(computeStaggerLayout(events, OPTIONS)).toHaveLength(2);
	});

	it('single event: staggerLevel 0, zIndex 1, unchanged position', () => {
		const [r] = computeStaggerLayout([makeEvent({ id: 'solo', x: 20, width: 180 })], OPTIONS);
		expect(r.staggerLevel).toBe(0);
		expect(r.zIndex).toBe(1);
		expect(r.x).toBe(20);
		expect(r.width).toBe(180);
	});

	it('non-overlapping events both get staggerLevel 0', () => {
		const a = makeEvent({ id: 'a', start: 1000, end: 2000 });
		const b = makeEvent({ id: 'b', start: 2000, end: 3000 });
		const [ra, rb] = computeStaggerLayout([a, b], OPTIONS);
		expect(ra.staggerLevel).toBe(0);
		expect(rb.staggerLevel).toBe(0);
	});

	it('overlapping events get distinct stagger levels', () => {
		const a = makeEvent({ id: 'a', start: 1000, end: 3000 });
		const b = makeEvent({ id: 'b', start: 1500, end: 2500 });
		const results = computeStaggerLayout([a, b], OPTIONS);
		const levels = results.map((r) => r.staggerLevel);
		expect(new Set(levels).size).toBe(2);
	});

	it('staggered event has larger x and smaller width than the base', () => {
		const a = makeEvent({ id: 'a', start: 1000, end: 3000, x: 0, width: 200 });
		const b = makeEvent({ id: 'b', start: 1500, end: 2500, x: 0, width: 200 });
		const results = computeStaggerLayout([a, b], OPTIONS);
		const staggered = results.find((r) => r.staggerLevel > 0)!;
		expect(staggered.x).toBeGreaterThan(0);
		expect(staggered.width).toBeLessThan(200);
	});

	it('enforces minEventHeight', () => {
		const [r] = computeStaggerLayout([makeEvent({ id: 'tiny', height: 10 })], {
			...OPTIONS,
			minEventHeight: 30,
		});
		expect(r.height).toBe(30);
	});

	it('does not clamp height already above minEventHeight', () => {
		const [r] = computeStaggerLayout([makeEvent({ id: 'tall', height: 90 })], OPTIONS);
		expect(r.height).toBe(90);
	});

	it('preserves input order in output', () => {
		const b = makeEvent({ id: 'b', start: 1500, end: 2500 });
		const a = makeEvent({ id: 'a', start: 1000, end: 3000 });
		const results = computeStaggerLayout([b, a], OPTIONS);
		expect(results[0].id).toBe('b');
		expect(results[1].id).toBe('a');
	});

	it('events on different x columns do not stagger each other', () => {
		const a = makeEvent({ id: 'a', start: 1000, end: 3000, x: 0 });
		const b = makeEvent({ id: 'b', start: 1000, end: 3000, x: 200 });
		const [ra, rb] = computeStaggerLayout([a, b], OPTIONS);
		expect(ra.staggerLevel).toBe(0);
		expect(rb.staggerLevel).toBe(0);
	});

	it('caps stagger offset at maxStaggerRatio × width', () => {
		const opts: StaggerLayoutOptions = {
			staggerIncrement: 100,
			maxStaggerRatio: 0.4,
			minEventHeight: 30,
		};
		const events = [
			makeEvent({ id: 'a', start: 1000, end: 5000, x: 0, width: 200 }),
			makeEvent({ id: 'b', start: 1500, end: 4500, x: 0, width: 200 }),
			makeEvent({ id: 'c', start: 2000, end: 4000, x: 0, width: 200 }),
		];
		for (const r of computeStaggerLayout(events, opts)) {
			// max offset = 0.4 × 200 = 80 px
			expect(r.x - 0).toBeLessThanOrEqual(80 + Number.EPSILON);
		}
	});

	/**
	 * Contract test: long-duration events are excluded by the caller (calendar_events.tsx)
	 * before being passed to computeStaggerLayout. This verifies that a short event
	 * retains its full column width when no long-duration sibling is in the input.
	 */
	it('short event keeps full width when long-duration sibling is excluded by caller', () => {
		const short = makeEvent({ id: 'short', start: 3600, end: 7200, x: 0, width: 200 });
		const [r] = computeStaggerLayout([short], OPTIONS);
		expect(r.staggerLevel).toBe(0);
		expect(r.x).toBe(0);
		expect(r.width).toBe(200);
	});
});
