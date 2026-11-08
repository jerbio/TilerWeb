import { act, renderHook } from '@testing-library/react';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useCalendarView from './useCalendarView';

function setup(initialWidth: number) {
	let width = initialWidth;
	let onResize!: () => void;
	const disconnect = vi.fn();
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(callback: () => void) {
				onResize = callback;
			}
			observe() {}
			disconnect = disconnect;
		}
	);
	const element = document.createElement('ul');
	Object.defineProperty(element, 'clientWidth', { get: () => width });
	// offsetWidth can include borders; the usable header width is authoritative.
	Object.defineProperty(element, 'offsetWidth', { get: () => width + 2 });
	const ref = { current: element };
	const hook = renderHook(() => useCalendarView(ref, 627));
	return {
		...hook,
		disconnect,
		resize: (next: number) => {
			act(() => {
				width = next;
				onResize();
			});
		},
	};
}

afterEach(() => vi.unstubAllGlobals());

describe('calendar width measurement', () => {
	it('uses the available column width and centers today only on first display', () => {
		const { result } = setup(499);
		expect(result.current.viewOptions.width).toBe(499);
		expect(result.current.viewOptions.daysInView).toBe(2);
		expect(
			result.current.viewOptions.startDay.isSame(dayjs().startOf('day').subtract(1, 'day'))
		).toBe(true);
	});

	it('remeasures panel resizes without moving the selected date range', () => {
		const { result, resize } = setup(499);
		act(() =>
			result.current.setViewOptions((prev) => ({ ...prev, startDay: dayjs('2026-10-21') }))
		);
		resize(1000);
		expect(result.current.viewOptions.width).toBe(1000);
		expect(result.current.viewOptions.daysInView).toBe(5);
		expect(result.current.viewOptions.startDay.format('YYYY-MM-DD')).toBe('2026-10-21');
	});

	it('retains useful geometry while hidden and updates when shown again', () => {
		const { result, resize } = setup(499);
		const previous = result.current.viewOptions;
		resize(0);
		expect(result.current.viewOptions).toBe(previous);
		resize(300);
		expect(result.current.viewOptions.width).toBe(300);
		expect(result.current.viewOptions.daysInView).toBe(1);
	});

	it('keeps one usable day at narrow widths and disconnects on unmount', () => {
		const { result, unmount, disconnect } = setup(100);
		expect(result.current.viewOptions.daysInView).toBe(1);
		unmount();
		expect(disconnect).toHaveBeenCalledOnce();
	});
});
