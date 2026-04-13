import { describe, it, expect } from 'vitest';
import { isLongDurationEvent, LONG_DURATION_THRESHOLD_MS } from './eventFilters';
import { SubCalendarEvent, ThirdPartyType } from '../common/types/schedule';

// Helper to create a minimal mock event
function createMockEvent(
	overrides: Partial<SubCalendarEvent> & { start: number; end: number }
): SubCalendarEvent {
	return {
		id: 'test-event-123',
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
		thirdPartyType: ThirdPartyType.Tiler,
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

describe('LONG_DURATION_THRESHOLD_MS', () => {
	it('equals exactly 15 hours in milliseconds', () => {
		expect(LONG_DURATION_THRESHOLD_MS).toBe(15 * 60 * 60 * 1000);
	});
});

describe('isLongDurationEvent', () => {
	describe('events under or at 15 hours', () => {
		it('returns false for a 1-hour event', () => {
			const start = new Date(2026, 3, 5, 9, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 10, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(false);
		});

		it('returns false for an 8-hour event', () => {
			const start = new Date(2026, 3, 5, 9, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 17, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(false);
		});

		it('returns false for exactly 15-hour event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 15, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(false);
		});
	});

	describe('events over 15 hours', () => {
		it('returns true for a 16-hour event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 16, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns true for a 15-hour-and-1-minute event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 15, 1, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns true for a 20-hour event', () => {
			const start = new Date(2026, 3, 5, 2, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns true for a 23-hour event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 23, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(true);
		});
	});

	describe('isProcrastinateEvent exemption', () => {
		it('returns false for a 16-hour procrastinate event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 16, 0, 0).getTime();
			const event = createMockEvent({
				start,
				end,
				isProcrastinateEvent: true,
			});

			expect(isLongDurationEvent(event)).toBe(false);
		});

		it('returns false for a 20-hour procrastinate event', () => {
			const start = new Date(2026, 3, 5, 2, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 22, 0, 0).getTime();
			const event = createMockEvent({
				start,
				end,
				isProcrastinateEvent: true,
			});

			expect(isLongDurationEvent(event)).toBe(false);
		});

		it('returns false for a short procrastinate event', () => {
			const start = new Date(2026, 3, 5, 9, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 10, 0, 0).getTime();
			const event = createMockEvent({
				start,
				end,
				isProcrastinateEvent: true,
			});

			expect(isLongDurationEvent(event)).toBe(false);
		});
	});

	describe('edge cases', () => {
		it('returns true for a 15-hour-and-1-millisecond event', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = start + LONG_DURATION_THRESHOLD_MS + 1;
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns true for non-viable long event (isViable does not affect classification)', () => {
			const start = new Date(2026, 3, 5, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 5, 20, 0, 0).getTime();
			const event = createMockEvent({
				start,
				end,
				isViable: false,
			});

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns false for a standalone short event without original times', () => {
			// A plain short event (no originalStart/originalEnd) is not long-duration
			const start = new Date(2026, 3, 6, 0, 0, 0).getTime();
			const end = new Date(2026, 3, 6, 10, 0, 0).getTime();
			const event = createMockEvent({ start, end });

			expect(isLongDurationEvent(event)).toBe(false);
		});
	});

	describe('split segment handling (originalStart/originalEnd)', () => {
		it('returns true for a short segment whose original event was >15h', () => {
			// After splitEventByDay: segment is 2h (10pm–midnight) but original was 20h
			const event = createMockEvent({
				start: new Date(2026, 3, 5, 22, 0, 0).getTime(),
				end: new Date(2026, 3, 5, 23, 59, 59).getTime(),
				originalStart: new Date(2026, 3, 5, 22, 0, 0).getTime(),
				originalEnd: new Date(2026, 3, 6, 18, 0, 0).getTime(), // 20h original
			});

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns true for the second segment of a split >15h event', () => {
			// After splitEventByDay: segment is midnight–6pm (18h) from a 20h original
			const event = createMockEvent({
				start: new Date(2026, 3, 6, 0, 0, 0).getTime(),
				end: new Date(2026, 3, 6, 18, 0, 0).getTime(),
				originalStart: new Date(2026, 3, 5, 22, 0, 0).getTime(),
				originalEnd: new Date(2026, 3, 6, 18, 0, 0).getTime(),
			});

			expect(isLongDurationEvent(event)).toBe(true);
		});

		it('returns false for a split segment of a short original event', () => {
			// Original event was 10h, split segment is 4h
			const event = createMockEvent({
				start: new Date(2026, 3, 6, 0, 0, 0).getTime(),
				end: new Date(2026, 3, 6, 4, 0, 0).getTime(),
				originalStart: new Date(2026, 3, 5, 18, 0, 0).getTime(),
				originalEnd: new Date(2026, 3, 6, 4, 0, 0).getTime(), // 10h original
			});

			expect(isLongDurationEvent(event)).toBe(false);
		});

		it('returns false for a split segment of a >15h procrastinate event', () => {
			// Procrastinate exemption applies even for split segments
			const event = createMockEvent({
				start: new Date(2026, 3, 5, 22, 0, 0).getTime(),
				end: new Date(2026, 3, 5, 23, 59, 59).getTime(),
				originalStart: new Date(2026, 3, 5, 22, 0, 0).getTime(),
				originalEnd: new Date(2026, 3, 6, 18, 0, 0).getTime(), // 20h original
				isProcrastinateEvent: true,
			});

			expect(isLongDurationEvent(event)).toBe(false);
		});
	});
});
