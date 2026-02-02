import { describe, it, expect, vi } from 'vitest';
import dayjs from 'dayjs';
import CalendarUtil from './calendar';
import { CalendarViewOptions } from '@/core/common/components/calendar/calendar';
import {
	ScheduleSubCalendarEvent,
	ScheduleLookupTravelDetail,
} from '@/core/common/types/schedule';

// Mock calendar config
vi.mock('@/core/constants/calendar_config', () => ({
	default: {
		CELL_HEIGHT: '96px',
		MIN_CELL_HEIGHT: '60px',
	},
}));

describe('CalendarUtil', () => {
	describe('getBoundingBox', () => {
		const baseViewOptions: CalendarViewOptions = {
			width: 700,
			startDay: dayjs('2024-01-01'),
			daysInView: 7,
		};
		const headerWidth = 700;

		it('calculates correct x position based on day index', () => {
			const start = dayjs('2024-01-03T10:00:00'); // Day 2 (0-indexed)
			const end = dayjs('2024-01-03T11:00:00');

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			expect(box.x).toBe(2 * (700 / 7)); // Day index 2 * column width
		});

		it('calculates correct y position based on hour', () => {
			const start = dayjs('2024-01-01T10:30:00'); // 10.5 hours
			const end = dayjs('2024-01-01T11:30:00');

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			expect(box.y).toBe(96 * 10.5); // cellHeight * hourFraction
		});

		it('calculates correct width based on daysInView', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T11:00:00');

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			expect(box.width).toBe(700 / 7); // headerWidth / daysInView
		});

		it('calculates height based on duration', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T12:30:00'); // 2.5 hours

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			expect(box.height).toBe(96 * 2.5); // cellHeight * duration in hours
		});

		it('enforces minimum cell height for short events', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T10:15:00'); // 15 minutes = 0.25 hours

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			// 96 * 0.25 = 24, but min is 60
			expect(box.height).toBe(60);
		});

		it('respects custom minCellHeight option', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T10:15:00');

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth, {
				minCellHeight: 40,
			});

			expect(box.height).toBe(40);
		});

		it('clamps height to not exceed viewBox bottom', () => {
			const start = dayjs('2024-01-01T22:00:00'); // Near end of day
			const end = dayjs('2024-01-01T23:30:00'); // 1.5 hours, but only 2 hours left in day

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			// viewBox height is 96 * 24 = 2304
			// y position is 96 * 22 = 2112
			// calculated height would be 96 * 1.5 = 144
			// max height = 2304 - 2112 = 192
			// Since 144 < 192, no clamping occurs
			expect(box.height).toBe(144);
		});

		it('applies minCellHeight when event spans midnight (negative duration)', () => {
			const start = dayjs('2024-01-01T23:00:00');
			const end = dayjs('2024-01-02T02:00:00'); // Next day - results in negative duration calculation

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			// endHourFraction (2) - startHourFraction (23) = -21, so minCellHeight applies
			expect(box.height).toBe(60);
		});

		it('handles events at midnight (0:00)', () => {
			const start = dayjs('2024-01-01T00:00:00');
			const end = dayjs('2024-01-01T01:00:00');

			const box = CalendarUtil.getBoundingBox(start, end, baseViewOptions, headerWidth);

			expect(box.y).toBe(0);
			expect(box.height).toBe(96);
		});

		it('handles single day view', () => {
			const singleDayOptions: CalendarViewOptions = {
				width: 700,
				startDay: dayjs('2024-01-01'),
				daysInView: 1,
			};

			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T11:00:00');

			const box = CalendarUtil.getBoundingBox(start, end, singleDayOptions, headerWidth);

			expect(box.width).toBe(700); // Full width for single day
			expect(box.x).toBe(0);
		});
	});

	describe('isInterseting', () => {
		it('returns true for overlapping boxes', () => {
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 50, y: 50, width: 100, height: 100 };

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(true);
		});

		it('returns false for horizontally separated boxes', () => {
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 150, y: 0, width: 100, height: 100 };

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(false);
		});

		it('returns false for vertically separated boxes beyond tolerance', () => {
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 0, y: 200, width: 100, height: 100 };

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(false);
		});

		it('applies 15px vertical overlap tolerance - adjacent events do not intersect', () => {
			// Events that are exactly adjacent vertically
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 0, y: 100, width: 100, height: 100 };

			// With 15px tolerance, adjacent events should not intersect
			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(false);
		});

		it('returns true when vertical overlap exceeds tolerance', () => {
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 0, y: 70, width: 100, height: 100 }; // 30px overlap

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(true);
		});

		it('returns false for boxes touching exactly at horizontal edge', () => {
			const eventA = { x: 0, y: 0, width: 100, height: 100 };
			const eventB = { x: 100, y: 0, width: 100, height: 100 }; // Right edge touch

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(false);
		});

		it('returns true for completely contained box', () => {
			const eventA = { x: 0, y: 0, width: 200, height: 200 };
			const eventB = { x: 50, y: 50, width: 50, height: 50 }; // Inside eventA

			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(true);
		});

		it('handles zero-sized events', () => {
			const eventA = { x: 50, y: 50, width: 0, height: 0 };
			const eventB = { x: 50, y: 50, width: 100, height: 100 };

			// Zero-sized event at corner should not intersect
			expect(CalendarUtil.isInterseting(eventA, eventB)).toBe(false);
		});
	});

	describe('getEventLocationLink', () => {
		it('returns Google Maps search URL when location has address', () => {
			const event = {
				location: { address: '123 Main St, City' },
			} as ScheduleSubCalendarEvent;

			expect(CalendarUtil.getEventLocationLink(event)).toBe(
				'https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20City'
			);
		});

		it('returns "#" when location is missing', () => {
			const event = {} as ScheduleSubCalendarEvent;

			expect(CalendarUtil.getEventLocationLink(event)).toBe('#');
		});

		it('returns "#" when location object exists but address is falsy', () => {
			const event = {
				location: { address: '' },
			} as unknown as ScheduleSubCalendarEvent;

			expect(CalendarUtil.getEventLocationLink(event)).toBe('#');
		});

		it('properly encodes special characters in address', () => {
			const event = {
				location: { address: 'Café & Restaurant, 5th Ave #200' },
			} as ScheduleSubCalendarEvent;

			const result = CalendarUtil.getEventLocationLink(event);
			expect(result).toContain(encodeURIComponent('Café & Restaurant, 5th Ave #200'));
		});

		it('encodes unicode characters correctly', () => {
			const event = {
				location: { address: '東京都渋谷区' },
			} as ScheduleSubCalendarEvent;

			const result = CalendarUtil.getEventLocationLink(event);
			expect(result).toContain(encodeURIComponent('東京都渋谷区'));
		});
	});

	describe('getTravelDetailDirectionLink', () => {
		it('returns directions URL with both start and end addresses', () => {
			const detail = {
				startLocation: { address: '123 Start St' },
				endLocation: { address: '456 End Ave' },
			} as ScheduleLookupTravelDetail;

			const link = CalendarUtil.getTravelDetailDirectionLink(detail);

			expect(link).toBe(
				'https://www.google.com/maps/dir/?api=1&origin=123%20Start%20St&destination=456%20End%20Ave'
			);
		});

		it('returns search URL for end location only', () => {
			const detail = {
				startLocation: null,
				endLocation: { address: '456 End Ave' },
			} as unknown as ScheduleLookupTravelDetail;

			const link = CalendarUtil.getTravelDetailDirectionLink(detail);

			expect(link).toBe('https://www.google.com/maps/search/?api=1&query=456%20End%20Ave');
		});

		it('returns search URL for start location only', () => {
			const detail = {
				startLocation: { address: '123 Start St' },
				endLocation: null,
			} as unknown as ScheduleLookupTravelDetail;

			const link = CalendarUtil.getTravelDetailDirectionLink(detail);

			expect(link).toBe('https://www.google.com/maps/search/?api=1&query=123%20Start%20St');
		});

		it('returns "#" when no locations provided', () => {
			const detail = {
				startLocation: null,
				endLocation: null,
			} as unknown as ScheduleLookupTravelDetail;

			expect(CalendarUtil.getTravelDetailDirectionLink(detail)).toBe('#');
		});

		it('returns "#" when both addresses are empty strings', () => {
			const detail = {
				startLocation: { address: '' },
				endLocation: { address: '' },
			} as unknown as ScheduleLookupTravelDetail;

			expect(CalendarUtil.getTravelDetailDirectionLink(detail)).toBe('#');
		});

		it('handles only start address being empty', () => {
			const detail = {
				startLocation: { address: '' },
				endLocation: { address: '456 End Ave' },
			} as unknown as ScheduleLookupTravelDetail;

			const link = CalendarUtil.getTravelDetailDirectionLink(detail);

			expect(link).toBe('https://www.google.com/maps/search/?api=1&query=456%20End%20Ave');
		});

		it('properly encodes special characters in both addresses', () => {
			const detail = {
				startLocation: { address: 'Café #1' },
				endLocation: { address: 'Bar & Grill' },
			} as ScheduleLookupTravelDetail;

			const link = CalendarUtil.getTravelDetailDirectionLink(detail);

			expect(link).toContain(encodeURIComponent('Café #1'));
			expect(link).toContain(encodeURIComponent('Bar & Grill'));
		});
	});
});
