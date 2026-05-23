import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import TimeUtil from '@/core/util/time';

/**
 * Compute the vertical scrollTop (px) used to anchor the calendar grid
 * one hour above the supplied time.
 *
 * Behavior:
 * - Returns `(hourFraction - 1) * cellHeightPx`, where `hourFraction`
 *   is the time-of-day as a fractional hour (0–24).
 * - Clamped to >= 0 so the first hour of the day never produces a
 *   negative scroll offset.
 */
export function computeInitialScrollTop(now: dayjs.Dayjs, cellHeightPx: number): number {
	const hourFraction = now.hour() + now.minute() / 60 + now.second() / 3600;
	return Math.max(0, (hourFraction - 1) * cellHeightPx);
}

/**
 * Scrolls the provided container to one hour before the current time
 * exactly once — on the first render where `ready` is true and the
 * container ref is attached.
 *
 * Intentionally does NOT depend on `startDay` / `daysInView`, so
 * navigating to other weeks preserves the user's current scroll
 * position instead of snapping back to "now".
 */
export function useInitialScrollToNow(
	containerRef: React.RefObject<HTMLElement | null>,
	cellHeightPx: number,
	ready: boolean
): void {
	const hasScrolledRef = useRef(false);

	useEffect(() => {
		if (!ready || hasScrolledRef.current || !containerRef.current) {
			return;
		}
		containerRef.current.scrollTop = computeInitialScrollTop(TimeUtil.nowDayjs(), cellHeightPx);
		hasScrolledRef.current = true;
	}, [ready, cellHeightPx, containerRef]);
}
