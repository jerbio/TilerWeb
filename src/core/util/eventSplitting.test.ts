import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { splitEventByDay } from './eventSplitting';
import { ScheduleSubCalendarEvent } from '../common/types/schedule';

// Helper to create a minimal mock event
function createMockEvent(
	overrides: Partial<ScheduleSubCalendarEvent> & { start: number; end: number }
): ScheduleSubCalendarEvent {
	return {
		id: 'test-event-123',
		start: overrides.start,
		end: overrides.end,
		name: 'Test Event',
		isSleep: false,
		sleepDay: 0,
		isWake: false,
		wakeDay: 0,
		isPaused: false,
		isRigid: false,
		isComplete: false,
		isEnabled: true,
		isTardy: false,
		isViable: true,
		isScheduleAble: true,
		isProcrastinateEvent: false,
		travelTimeBefore: 0,
		travelTimeAfter: 0,
		travelTimeBeforeDetail: '',
		travelTimeAfterDetail: '',
		locationId: null,
		locationValidationId: '',
		isCompleteAfterElapsedEnabled: false,
		thirdPartyType: 'tiler',
		thirdPartyUserId: null,
		thirdPartyId: '',
		priority: 0,
		tileShareDesignatedId: null,
		projectionType: ['SimpleObject'],
		address: '',
		addressDescription: '',
		location: {
			id: '',
			description: '',
			address: '',
			longitude: 0,
			latitude: 0,
			isVerified: false,
			isDefault: false,
			isNull: true,
			thirdPartyId: '',
			userId: '',
			source: '',
			nickname: '',
		},
		description: '',
		searchdDescription: '',
		rangeStart: overrides.start,
		rangeEnd: overrides.end,
		colorOpacity: 1,
		colorRed: 100,
		colorGreen: 150,
		colorBlue: 200,
		isRecurring: false,
		emojis: null,
		isReadOnly: false,
		restrictionProfile: null,
		isWhatIf: false,
		jsonProjectionType: 'SimpleObject',
		blob: { type: 0, note: '', id: '' },
		styleProperties: {
			id: '',
			color: { colorSelection: 0, r: 100, g: 150, b: 200, o: 1 },
		},
		split: 1,
		calendarEventStart: overrides.start,
		calendarEventEnd: overrides.end,
		SubCalCalEventStart: overrides.start,
		SubCalCalEventEnd: overrides.end,
		travelDetail: { before: null, after: null },
		...overrides,
	};
}

describe('splitEventByDay', () => {
	describe('single-day events', () => {
		it('returns single segment for same-day event', () => {
			// Event from 9 AM to 5 PM on April 5
			const start = new Date(2026, 3, 5, 9, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 17, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			expect(result).toHaveLength(1);
			expect(result[0].key).toBe('test-event-123');
		});

		it('preserves originalStart and originalEnd for single-day events', () => {
			const start = new Date(2026, 3, 5, 9, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 17, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			expect(result[0].originalStart).toBe(start);
			expect(result[0].originalEnd).toBe(end);
			expect(result[0].start).toBe(start);
			expect(result[0].end).toBe(end);
		});
	});

	describe('multi-day events', () => {
		it('splits 2-day event into 2 segments', () => {
			// Event from April 5 at 10 PM to April 6 at 8 AM
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 8, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			expect(result).toHaveLength(2);
			expect(result[0].key).toBe('test-event-123-0');
			expect(result[1].key).toBe('test-event-123-1');
		});

		it('preserves originalStart and originalEnd on all segments', () => {
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 8, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// Both segments should have the same original times
			expect(result[0].originalStart).toBe(start);
			expect(result[0].originalEnd).toBe(end);
			expect(result[1].originalStart).toBe(start);
			expect(result[1].originalEnd).toBe(end);
		});

		it('first segment keeps original start, ends at end of day', () => {
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 8, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// First segment should start at original time
			expect(result[0].start).toBe(start);
			// First segment should end at 23:59:59.999 of April 5
			const expectedFirstEnd = dayjs(start).endOf('day').unix() * 1000;
			expect(result[0].end).toBe(expectedFirstEnd);
		});

		it('last segment starts at start of day, keeps original end', () => {
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 8, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// Last segment should start at midnight of April 6
			const expectedLastStart = dayjs(end).startOf('day').unix() * 1000;
			expect(result[1].start).toBe(expectedLastStart);
			// Last segment should keep original end
			expect(result[1].end).toBe(end);
		});

		it('splits 3-day event into 3 segments', () => {
			// Event from April 5 at 6 PM to April 7 at 10 AM
			const start = new Date(2026, 3, 5, 18, 0, 0).getTime();
			const end = new Date(2026, 3, 7, 10, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			expect(result).toHaveLength(3);
			expect(result[0].key).toBe('test-event-123-0');
			expect(result[1].key).toBe('test-event-123-1');
			expect(result[2].key).toBe('test-event-123-2');
		});

		it('middle segment spans full day (midnight to 23:59:59)', () => {
			const start = new Date(2026, 3, 5, 18, 0, 0).getTime();
			const end = new Date(2026, 3, 7, 10, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// Middle segment (April 6) should span full day
			const april6Start = dayjs(start).add(1, 'day').startOf('day').unix() * 1000;
			const april6End = dayjs(start).add(1, 'day').endOf('day').unix() * 1000;

			expect(result[1].start).toBe(april6Start);
			expect(result[1].end).toBe(april6End);
			// But still preserve original times
			expect(result[1].originalStart).toBe(start);
			expect(result[1].originalEnd).toBe(end);
		});
	});

	describe('midnight edge case', () => {
		it('treats event ending exactly at midnight as part of previous day', () => {
			// Event from April 5 at 10 PM to April 6 at exactly midnight (00:00:00)
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 0, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// Should NOT split - midnight end is treated as 23:59:59.999 of April 5
			expect(result).toHaveLength(1);
			expect(result[0].key).toBe('test-event-123');
		});

		it('preserves original midnight end time in originalEnd', () => {
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 0, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			const result = splitEventByDay(event);

			// originalEnd should be the actual midnight timestamp
			expect(result[0].originalEnd).toBe(end);
		});
	});

	describe('data integrity', () => {
		it('preserves all event properties on split segments', () => {
			const start = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 8, 0, 0).getTime();
			const event = createMockEvent({
				start,
				end,
				name: 'Important Meeting',
				colorRed: 255,
				colorGreen: 128,
				colorBlue: 64,
				isRecurring: true,
			});

			const result = splitEventByDay(event);

			// Both segments should have the same properties
			for (const segment of result) {
				expect(segment.name).toBe('Important Meeting');
				expect(segment.colorRed).toBe(255);
				expect(segment.colorGreen).toBe(128);
				expect(segment.colorBlue).toBe(64);
				expect(segment.isRecurring).toBe(true);
			}
		});
	});
});
