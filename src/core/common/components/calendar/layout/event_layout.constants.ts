/**
 * Stagger layout constants for calendar event overlap rendering.
 *
 * Events cascade rightward with small left margin offsets based on overlap depth.
 * This preserves near-full width for readability while showing all overlapping events.
 */

/** Stagger increment in pixels per environment */
export const STAGGER_INCREMENT = {
	MOBILE: 20,
	TABLET: 24,
	DESKTOP: 16,
} as const;

/** Minimum event height in pixels to ensure touch/click targets */
export const MIN_EVENT_HEIGHT = {
	TOUCH: 44,
	POINTER: 28,
} as const;

/** Maximum ratio of available width that can be consumed by stagger offsets */
export const MAX_STAGGER_RATIO = 0.5;

/** Breakpoints in pixels for responsive stagger increments */
export const BREAKPOINTS = {
	MOBILE_MIN: 0,
	MOBILE_MAX: 428,
	TABLET_MIN: 429,
	TABLET_MAX: 1024,
	DESKTOP_MIN: 1025,
} as const;

/**
 * Returns the stagger increment for a given viewport width.
 */
export function getStaggerIncrement(viewportWidth: number): number {
	if (viewportWidth <= BREAKPOINTS.MOBILE_MAX) return STAGGER_INCREMENT.MOBILE;
	if (viewportWidth <= BREAKPOINTS.TABLET_MAX) return STAGGER_INCREMENT.TABLET;
	return STAGGER_INCREMENT.DESKTOP;
}

/**
 * Returns the minimum event height for a given viewport width.
 * Touch devices (mobile/tablet) get larger targets.
 */
export function getMinEventHeight(viewportWidth: number): number {
	if (viewportWidth <= BREAKPOINTS.TABLET_MAX) return MIN_EVENT_HEIGHT.TOUCH;
	return MIN_EVENT_HEIGHT.POINTER;
}
