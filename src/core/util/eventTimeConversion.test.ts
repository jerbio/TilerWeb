import { describe, it, expect } from 'vitest';
import {
	dateTimeToUnix,
	timeToDate,
	unixToTimeString,
	validateTimeRange,
	validateDateTimeRange,
	formatDueIn,
	calculateDuration,
	adjustEndDateTime,
} from './eventTimeConversion';

describe('eventTimeConversion', () => {
	describe('timeToDate', () => {
		it('converts unix timestamp to YYYY-MM-DD format in local time', () => {
			// Create a specific local time date
			const localDate = new Date(2026, 3, 5, 14, 30, 0); // April 5, 2026, 2:30 PM local
			const timestamp = localDate.getTime();

			const result = timeToDate(timestamp);

			// Should return the local date, not shifted by timezone
			expect(result).toBe('2026-04-05');
		});

		it('preserves date across different times of day', () => {
			// Test morning time
			const morning = new Date(2026, 3, 5, 8, 0, 0); // 8:00 AM local
			expect(timeToDate(morning.getTime())).toBe('2026-04-05');

			// Test evening time
			const evening = new Date(2026, 3, 5, 20, 0, 0); // 8:00 PM local
			expect(timeToDate(evening.getTime())).toBe('2026-04-05');

			// Test near midnight
			const nearMidnight = new Date(2026, 3, 5, 23, 59, 0); // 11:59 PM local
			expect(timeToDate(nearMidnight.getTime())).toBe('2026-04-05');
		});

		it('handles date boundaries correctly', () => {
			// Just after midnight
			const afterMidnight = new Date(2026, 3, 6, 0, 1, 0); // April 6, 12:01 AM
			expect(timeToDate(afterMidnight.getTime())).toBe('2026-04-06');
		});
	});

	describe('unixToTimeString', () => {
		it('converts unix timestamp to h:mm A format', () => {
			const date = new Date(2026, 3, 5, 14, 30, 0); // 2:30 PM local
			const timestamp = date.getTime();

			const result = unixToTimeString(timestamp);

			expect(result).toBe('2:30 PM');
		});

		it('handles AM times correctly', () => {
			const date = new Date(2026, 3, 5, 9, 15, 0); // 9:15 AM local
			expect(unixToTimeString(date.getTime())).toBe('9:15 AM');
		});

		it('handles noon correctly', () => {
			const date = new Date(2026, 3, 5, 12, 0, 0); // 12:00 PM
			expect(unixToTimeString(date.getTime())).toBe('12:00 PM');
		});

		it('handles midnight correctly', () => {
			const date = new Date(2026, 3, 5, 0, 0, 0); // 12:00 AM
			expect(unixToTimeString(date.getTime())).toBe('12:00 AM');
		});
	});

	describe('dateTimeToUnix', () => {
		it('converts date and time strings to unix timestamp', () => {
			const result = dateTimeToUnix('2026-04-05', '2:30 PM');

			const expected = new Date(2026, 3, 5, 14, 30, 0).getTime();
			expect(result).toBe(expected);
		});

		it('handles AM times correctly', () => {
			const result = dateTimeToUnix('2026-04-05', '9:15 AM');

			const expected = new Date(2026, 3, 5, 9, 15, 0).getTime();
			expect(result).toBe(expected);
		});

		it('handles 12 AM (midnight) correctly', () => {
			const result = dateTimeToUnix('2026-04-05', '12:00 AM');

			const expected = new Date(2026, 3, 5, 0, 0, 0).getTime();
			expect(result).toBe(expected);
		});

		it('handles 12 PM (noon) correctly', () => {
			const result = dateTimeToUnix('2026-04-05', '12:00 PM');

			const expected = new Date(2026, 3, 5, 12, 0, 0).getTime();
			expect(result).toBe(expected);
		});

		it('handles times with minutes correctly', () => {
			const result = dateTimeToUnix('2026-04-05', '3:45 PM');

			const expected = new Date(2026, 3, 5, 15, 45, 0).getTime();
			expect(result).toBe(expected);
		});
	});

	describe('round-trip consistency', () => {
		it('timeToDate and unixToTimeString should be consistent with dateTimeToUnix', () => {
			// Start with a known timestamp
			const originalDate = new Date(2026, 3, 5, 14, 30, 0); // April 5, 2026, 2:30 PM
			const originalTimestamp = originalDate.getTime();

			// Convert to strings
			const dateStr = timeToDate(originalTimestamp);
			const timeStr = unixToTimeString(originalTimestamp);

			// Convert back to timestamp
			const roundTripTimestamp = dateTimeToUnix(dateStr, timeStr);

			// Should match (within seconds precision since we zero out seconds)
			expect(roundTripTimestamp).toBe(originalTimestamp);
		});

		it('maintains date consistency when converting back and forth', () => {
			// This test specifically catches the timezone bug where dates shift
			const testCases = [
				new Date(2026, 3, 5, 8, 0, 0), // Morning
				new Date(2026, 3, 5, 14, 0, 0), // Afternoon
				new Date(2026, 3, 5, 20, 0, 0), // Evening
				new Date(2026, 3, 5, 23, 0, 0), // Late night
			];

			for (const original of testCases) {
				const timestamp = original.getTime();
				const dateStr = timeToDate(timestamp);
				const timeStr = unixToTimeString(timestamp);
				const roundTrip = dateTimeToUnix(dateStr, timeStr);

				// The date portion should remain April 5
				const roundTripDate = new Date(roundTrip);
				expect(roundTripDate.getFullYear()).toBe(2026);
				expect(roundTripDate.getMonth()).toBe(3); // April (0-indexed)
				expect(roundTripDate.getDate()).toBe(5);
			}
		});
	});

	describe('validateTimeRange', () => {
		it('returns true when end time is after start time', () => {
			const result = validateTimeRange('2026-04-05', '9:00 AM', '5:00 PM');
			expect(result).toBe(true);
		});

		it('returns false when end time equals start time', () => {
			const result = validateTimeRange('2026-04-05', '9:00 AM', '9:00 AM');
			expect(result).toBe(false);
		});

		it('returns false when end time is before start time', () => {
			const result = validateTimeRange('2026-04-05', '5:00 PM', '9:00 AM');
			expect(result).toBe(false);
		});

		it('handles times crossing noon correctly', () => {
			const result = validateTimeRange('2026-04-05', '11:00 AM', '1:00 PM');
			expect(result).toBe(true);
		});
	});

	describe('validateDateTimeRange', () => {
		describe('same date scenarios', () => {
			it('returns true when end time is after start time on same date', () => {
				const result = validateDateTimeRange(
					'2026-04-05',
					'9:00 AM',
					'2026-04-05',
					'5:00 PM'
				);
				expect(result).toBe(true);
			});

			it('returns false when end time equals start time on same date', () => {
				const result = validateDateTimeRange(
					'2026-04-05',
					'9:00 AM',
					'2026-04-05',
					'9:00 AM'
				);
				expect(result).toBe(false);
			});

			it('returns false when end time is before start time on same date', () => {
				const result = validateDateTimeRange(
					'2026-04-05',
					'5:00 PM',
					'2026-04-05',
					'9:00 AM'
				);
				expect(result).toBe(false);
			});
		});

		describe('different date scenarios (multi-day events)', () => {
			it('returns true when end date is after start date', () => {
				// Event from April 5 at 10 PM to April 6 at 8 AM
				const result = validateDateTimeRange(
					'2026-04-05',
					'10:00 PM',
					'2026-04-06',
					'8:00 AM'
				);
				expect(result).toBe(true);
			});

			it('returns true when end time is earlier but date is later (overnight event)', () => {
				// Event from April 5 at 11 PM to April 6 at 2 AM
				const result = validateDateTimeRange(
					'2026-04-05',
					'11:00 PM',
					'2026-04-06',
					'2:00 AM'
				);
				expect(result).toBe(true);
			});

			it('returns true for multi-day events spanning several days', () => {
				// Event from April 5 at 6 PM to April 8 at 10 AM
				const result = validateDateTimeRange(
					'2026-04-05',
					'6:00 PM',
					'2026-04-08',
					'10:00 AM'
				);
				expect(result).toBe(true);
			});

			it('returns false when end date is before start date', () => {
				// Invalid: end date is before start date
				const result = validateDateTimeRange(
					'2026-04-06',
					'9:00 AM',
					'2026-04-05',
					'5:00 PM'
				);
				expect(result).toBe(false);
			});

			it('returns false when dates are swapped even with same times', () => {
				const result = validateDateTimeRange(
					'2026-04-06',
					'9:00 AM',
					'2026-04-05',
					'9:00 AM'
				);
				expect(result).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('handles midnight correctly for overnight events', () => {
				// Event ending at exactly midnight next day
				const result = validateDateTimeRange(
					'2026-04-05',
					'10:00 PM',
					'2026-04-06',
					'12:00 AM'
				);
				expect(result).toBe(true);
			});

			it('handles events starting at midnight', () => {
				const result = validateDateTimeRange(
					'2026-04-05',
					'12:00 AM',
					'2026-04-05',
					'8:00 AM'
				);
				expect(result).toBe(true);
			});

			it('handles month boundaries', () => {
				// Event from March 31 to April 1
				const result = validateDateTimeRange(
					'2026-03-31',
					'10:00 PM',
					'2026-04-01',
					'2:00 AM'
				);
				expect(result).toBe(true);
			});

			it('handles year boundaries', () => {
				// Event from Dec 31 to Jan 1
				const result = validateDateTimeRange(
					'2026-12-31',
					'11:00 PM',
					'2027-01-01',
					'1:00 AM'
				);
				expect(result).toBe(true);
			});
		});
	});

	describe('formatDueIn', () => {
		it('returns minutes when event is less than 1 hour away', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime(); // 10:00 AM
			const start = new Date(2026, 2, 17, 10, 30, 0).getTime(); // 10:30 AM
			expect(formatDueIn(start, now)).toBe('30 minutes');
		});

		it('returns singular "minute" for 1 minute', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			const start = new Date(2026, 2, 17, 10, 1, 0).getTime();
			expect(formatDueIn(start, now)).toBe('1 minute');
		});

		it('returns hours when event is 1-23 hours away', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			const start = new Date(2026, 2, 17, 15, 0, 0).getTime(); // 5 hours later
			expect(formatDueIn(start, now)).toBe('5 hours');
		});

		it('returns singular "hour" for 1 hour', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			const start = new Date(2026, 2, 17, 11, 0, 0).getTime();
			expect(formatDueIn(start, now)).toBe('1 hour');
		});

		it('returns days when event is 24+ hours away', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			const start = new Date(2026, 2, 20, 10, 0, 0).getTime(); // 3 days later
			expect(formatDueIn(start, now)).toBe('3 days');
		});

		it('returns singular "day" for 1 day', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			const start = new Date(2026, 2, 18, 10, 0, 0).getTime();
			expect(formatDueIn(start, now)).toBe('1 day');
		});

		it('returns 0 minutes when start equals now', () => {
			const now = new Date(2026, 2, 17, 10, 0, 0).getTime();
			expect(formatDueIn(now, now)).toBe('0 minutes');
		});

		it('uses current time when nowMs is not provided', () => {
			const futureStart = Date.now() + 2 * 60 * 60 * 1000; // 2 hours from now
			expect(formatDueIn(futureStart)).toBe('2 hours');
		});
	});

	describe('calculateDuration', () => {
		it('returns correct duration for same-day event', () => {
			expect(calculateDuration('2026-04-05', '9:00 AM', '2026-04-05', '11:30 AM')).toBe(
				'2h 30m'
			);
		});

		it('returns correct duration for multi-hour event', () => {
			expect(calculateDuration('2026-04-05', '4:01 PM', '2026-04-05', '6:00 PM')).toBe(
				'1h 59m'
			);
		});

		it('handles midnight crossing on same date by adding 24h', () => {
			// Start 11:00 PM, End 1:00 AM — same date means end crosses midnight
			expect(calculateDuration('2026-04-05', '11:00 PM', '2026-04-05', '1:00 AM')).toBe('2h');
		});

		it('handles midnight crossing: 12:30 PM to 1:30 AM same date', () => {
			expect(calculateDuration('2026-04-05', '12:30 PM', '2026-04-05', '1:30 AM')).toBe(
				'13h'
			);
		});

		it('handles correct multi-day event without adding 24h', () => {
			// Different dates — no midnight adjustment needed
			expect(calculateDuration('2026-04-05', '10:00 PM', '2026-04-06', '2:00 AM')).toBe('4h');
		});

		it('treats same start and end on same date as full 24h crossing', () => {
			expect(calculateDuration('2026-04-05', '9:00 AM', '2026-04-05', '9:00 AM')).toBe('1d');
		});

		it('handles short durations correctly', () => {
			expect(calculateDuration('2026-04-05', '9:00 AM', '2026-04-05', '9:15 AM')).toBe('15m');
		});
	});

	describe('adjustEndDateTime', () => {
		it('shifts end time forward when start time moves forward', () => {
			// Start moves from 2:00 PM to 3:00 PM (+1h), end should shift from 4:00 PM to 5:00 PM
			const result = adjustEndDateTime(
				'2026-04-05',
				'2:00 PM', // old start
				'2026-04-05',
				'3:00 PM', // new start
				'2026-04-05',
				'4:00 PM' // old end
			);
			expect(result.endDate).toBe('2026-04-05');
			expect(result.endTime).toBe('5:00 PM');
		});

		it('shifts end time backward when start time moves backward', () => {
			// Start moves from 3:00 PM to 1:00 PM (-2h), end should shift from 5:00 PM to 3:00 PM
			const result = adjustEndDateTime(
				'2026-04-05',
				'3:00 PM',
				'2026-04-05',
				'1:00 PM',
				'2026-04-05',
				'5:00 PM'
			);
			expect(result.endDate).toBe('2026-04-05');
			expect(result.endTime).toBe('3:00 PM');
		});

		it('shifts end date when start time crosses midnight', () => {
			// 2h event: 11:00 PM to 1:00 AM next day. Move start to 11:30 PM -> end becomes 1:30 AM next day
			const result = adjustEndDateTime(
				'2026-04-05',
				'11:00 PM',
				'2026-04-05',
				'11:30 PM',
				'2026-04-06',
				'1:00 AM'
			);
			expect(result.endDate).toBe('2026-04-06');
			expect(result.endTime).toBe('1:30 AM');
		});

		it('shifts end to next day when start change pushes past midnight', () => {
			// 3h event: 9:00 PM to midnight (12:00 AM next day). Move start to 10:00 PM -> end 1:00 AM next day
			const result = adjustEndDateTime(
				'2026-04-05',
				'9:00 PM',
				'2026-04-05',
				'10:00 PM',
				'2026-04-06',
				'12:00 AM'
			);
			expect(result.endDate).toBe('2026-04-06');
			expect(result.endTime).toBe('1:00 AM');
		});

		it('handles start date change preserving duration', () => {
			// Move start from Apr 5 to Apr 6, same time. End should also move by 1 day.
			const result = adjustEndDateTime(
				'2026-04-05',
				'2:00 PM',
				'2026-04-06',
				'2:00 PM',
				'2026-04-05',
				'4:00 PM'
			);
			expect(result.endDate).toBe('2026-04-06');
			expect(result.endTime).toBe('4:00 PM');
		});

		it('preserves duration with 15-minute increments', () => {
			// 1h 59m event. Move start from 4:01 PM to 4:15 PM -> end from 6:00 PM to 6:14 PM
			const result = adjustEndDateTime(
				'2026-04-05',
				'4:01 PM',
				'2026-04-05',
				'4:15 PM',
				'2026-04-05',
				'6:00 PM'
			);
			expect(result.endDate).toBe('2026-04-05');
			expect(result.endTime).toBe('6:14 PM');
		});

		it('handles same start time (no change)', () => {
			const result = adjustEndDateTime(
				'2026-04-05',
				'2:00 PM',
				'2026-04-05',
				'2:00 PM',
				'2026-04-05',
				'4:00 PM'
			);
			expect(result.endDate).toBe('2026-04-05');
			expect(result.endTime).toBe('4:00 PM');
		});
	});
});
