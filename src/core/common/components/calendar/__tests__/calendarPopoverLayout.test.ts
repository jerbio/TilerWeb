import { describe, expect, it } from 'vitest';
import { getCalendarPopoverLayout } from '../calendarPopoverLayout';

describe('calendar event details placement', () => {
	it.each([230, 375, 800, 1200])('keeps the popover inside a %ipx calendar', (containerWidth) => {
		const layout = getCalendarPopoverLayout({
			anchorX: containerWidth - 90,
			anchorY: 500,
			anchorWidth: 150,
			containerWidth,
			containerHeight: 700,
		});
		expect(layout.x).toBeGreaterThanOrEqual(0);
		expect(layout.x + layout.width).toBeLessThanOrEqual(containerWidth);
		expect(layout.y + layout.maxHeight).toBeLessThanOrEqual(734);
	});

	it('shrinks details on a narrow desktop calendar instead of overflowing into chat', () => {
		const layout = getCalendarPopoverLayout({
			anchorX: 70,
			anchorY: 60,
			anchorWidth: 150,
			containerWidth: 230,
			containerHeight: 700,
		});
		expect(layout.width).toBe(206);
		expect(layout.x).toBe(12);
	});

	it('reserves space for the return control or mobile review sheet', () => {
		const layout = getCalendarPopoverLayout({
			anchorX: 70,
			anchorY: 500,
			anchorWidth: 150,
			containerWidth: 375,
			containerHeight: 500,
			bottomInset: 72,
		});
		expect(layout.y + layout.maxHeight).toBeLessThanOrEqual(462);
		expect(layout.maxHeight).toBeGreaterThan(0);
	});
});
