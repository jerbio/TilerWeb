import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import { renderHook } from '@testing-library/react';
import { computeInitialScrollTop, useInitialScrollToNow } from '../calendar_auto_scroll';
import TimeUtil from '@/core/util/time';

const CELL_HEIGHT = 96;

describe('computeInitialScrollTop — initial auto-scroll math', () => {
	it('anchors the viewport one hour above the current time', () => {
		// 16:30 → hourFraction = 16.5 → (16.5 - 1) * 96 = 1488
		const now = dayjs('2026-05-23T16:30:00');
		expect(computeInitialScrollTop(now, CELL_HEIGHT)).toBe((16.5 - 1) * CELL_HEIGHT);
	});

	it('includes seconds in the fractional hour calculation', () => {
		// 10:15:30 → 10 + 15/60 + 30/3600 = 10.2583... → (h - 1) * 96
		const now = dayjs('2026-05-23T10:15:30');
		const expected = (10 + 15 / 60 + 30 / 3600 - 1) * CELL_HEIGHT;
		expect(computeInitialScrollTop(now, CELL_HEIGHT)).toBeCloseTo(expected, 5);
	});

	it('clamps to 0 when current time is before 01:00 (would be negative)', () => {
		const now = dayjs('2026-05-23T00:30:00');
		expect(computeInitialScrollTop(now, CELL_HEIGHT)).toBe(0);
	});

	it('returns 0 exactly at 01:00', () => {
		const now = dayjs('2026-05-23T01:00:00');
		expect(computeInitialScrollTop(now, CELL_HEIGHT)).toBe(0);
	});

	it('returns the full day height minus one cell at 23:59:59', () => {
		const now = dayjs('2026-05-23T23:59:59');
		const expected = (23 + 59 / 60 + 59 / 3600 - 1) * CELL_HEIGHT;
		expect(computeInitialScrollTop(now, CELL_HEIGHT)).toBeCloseTo(expected, 5);
	});

	it('scales linearly with cell height', () => {
		const now = dayjs('2026-05-23T12:00:00');
		expect(computeInitialScrollTop(now, 60)).toBe((12 - 1) * 60);
		expect(computeInitialScrollTop(now, 120)).toBe((12 - 1) * 120);
	});

	it('does NOT depend on the date — only the time-of-day matters', () => {
		const may = dayjs('2026-05-23T14:00:00');
		const december = dayjs('2026-12-25T14:00:00');
		expect(computeInitialScrollTop(may, CELL_HEIGHT)).toBe(
			computeInitialScrollTop(december, CELL_HEIGHT)
		);
	});
});

describe('useInitialScrollToNow — mount + navigation behavior', () => {
	let nowSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		// Freeze "now" at 16:30 → expected scrollTop = (16.5 - 1) * 96 = 1488
		nowSpy = vi.spyOn(TimeUtil, 'nowDayjs').mockReturnValue(dayjs('2026-05-23T16:30:00'));
	});

	afterEach(() => {
		nowSpy.mockRestore();
	});

	function makeContainer(): { ref: React.RefObject<HTMLElement>; el: HTMLElement } {
		const el = document.createElement('div');
		// jsdom doesn't lay out elements, but scrollTop is a plain settable
		// number on HTMLElement so direct assignment is observable.
		return { ref: { current: el }, el };
	}

	it('scrolls the container to (now - 1hr) on initial mount when ready', () => {
		const { ref, el } = makeContainer();
		renderHook(() => useInitialScrollToNow(ref, CELL_HEIGHT, true));
		expect(el.scrollTop).toBe((16.5 - 1) * CELL_HEIGHT);
	});

	it('does NOT scroll while ready=false (e.g. width not yet measured)', () => {
		const { ref, el } = makeContainer();
		const { rerender } = renderHook(
			({ ready }: { ready: boolean }) => useInitialScrollToNow(ref, CELL_HEIGHT, ready),
			{ initialProps: { ready: false } }
		);
		expect(el.scrollTop).toBe(0);

		// Becomes ready → scrolls exactly once.
		rerender({ ready: true });
		expect(el.scrollTop).toBe((16.5 - 1) * CELL_HEIGHT);
	});

	it('does NOT overwrite the user scroll position on subsequent re-renders (week navigation)', () => {
		const { ref, el } = makeContainer();
		const { rerender } = renderHook(() => useInitialScrollToNow(ref, CELL_HEIGHT, true));
		expect(el.scrollTop).toBe((16.5 - 1) * CELL_HEIGHT);

		// User scrolls to 8 PM, then navigates to a different week which
		// triggers a parent re-render. The hook must NOT snap back to "now".
		el.scrollTop = 20 * CELL_HEIGHT;
		rerender();
		rerender();
		expect(el.scrollTop).toBe(20 * CELL_HEIGHT);
	});

	it('only reads TimeUtil.nowDayjs() once across many re-renders', () => {
		const { ref } = makeContainer();
		const { rerender } = renderHook(() => useInitialScrollToNow(ref, CELL_HEIGHT, true));
		rerender();
		rerender();
		rerender();
		expect(nowSpy).toHaveBeenCalledTimes(1);
	});

	it('skips the scroll cleanly when the container ref is null', () => {
		const ref: React.RefObject<HTMLElement | null> = { current: null };
		expect(() => {
			renderHook(() => useInitialScrollToNow(ref, CELL_HEIGHT, true));
		}).not.toThrow();
	});
});
