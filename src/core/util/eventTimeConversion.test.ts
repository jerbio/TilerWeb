import { describe, it, expect } from 'vitest';
import {
	dateTimeToUnix,
	timeToDate,
	unixToTimeString,
	validateTimeRange,
	validateDateTimeRange,
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
				new Date(2026, 3, 5, 8, 0, 0),  // Morning
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
				const result = validateDateTimeRange('2026-04-05', '9:00 AM', '2026-04-05', '5:00 PM');
				expect(result).toBe(true);
			});

			it('returns false when end time equals start time on same date', () => {
				const result = validateDateTimeRange('2026-04-05', '9:00 AM', '2026-04-05', '9:00 AM');
				expect(result).toBe(false);
			});

			it('returns false when end time is before start time on same date', () => {
				const result = validateDateTimeRange('2026-04-05', '5:00 PM', '2026-04-05', '9:00 AM');
				expect(result).toBe(false);
			});
		});

		describe('different date scenarios (multi-day events)', () => {
			it('returns true when end date is after start date', () => {
				// Event from April 5 at 10 PM to April 6 at 8 AM
				const result = validateDateTimeRange('2026-04-05', '10:00 PM', '2026-04-06', '8:00 AM');
				expect(result).toBe(true);
			});

			it('returns true when end time is earlier but date is later (overnight event)', () => {
				// Event from April 5 at 11 PM to April 6 at 2 AM
				const result = validateDateTimeRange('2026-04-05', '11:00 PM', '2026-04-06', '2:00 AM');
				expect(result).toBe(true);
			});

			it('returns true for multi-day events spanning several days', () => {
				// Event from April 5 at 6 PM to April 8 at 10 AM
				const result = validateDateTimeRange('2026-04-05', '6:00 PM', '2026-04-08', '10:00 AM');
				expect(result).toBe(true);
			});

			it('returns false when end date is before start date', () => {
				// Invalid: end date is before start date
				const result = validateDateTimeRange('2026-04-06', '9:00 AM', '2026-04-05', '5:00 PM');
				expect(result).toBe(false);
			});

			it('returns false when dates are swapped even with same times', () => {
				const result = validateDateTimeRange('2026-04-06', '9:00 AM', '2026-04-05', '9:00 AM');
				expect(result).toBe(false);
			});
		});

		describe('edge cases', () => {
			it('handles midnight correctly for overnight events', () => {
				// Event ending at exactly midnight next day
				const result = validateDateTimeRange('2026-04-05', '10:00 PM', '2026-04-06', '12:00 AM');
				expect(result).toBe(true);
			});

			it('handles events starting at midnight', () => {
				const result = validateDateTimeRange('2026-04-05', '12:00 AM', '2026-04-05', '8:00 AM');
				expect(result).toBe(true);
			});

			it('handles month boundaries', () => {
				// Event from March 31 to April 1
				const result = validateDateTimeRange('2026-03-31', '10:00 PM', '2026-04-01', '2:00 AM');
				expect(result).toBe(true);
			});

			it('handles year boundaries', () => {
				// Event from Dec 31 to Jan 1
				const result = validateDateTimeRange('2026-12-31', '11:00 PM', '2027-01-01', '1:00 AM');
				expect(result).toBe(true);
			});
		});
	});
});
