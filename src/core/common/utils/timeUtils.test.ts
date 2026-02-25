import { describe, it, expect } from 'vitest';
import {
	timeStringToMs,
	msToTimeString,
	normalizeTimeString,
	calculateSleepDurationMs,
	calculateBedTimeStart,
	calculateBedTimeEnd,
} from './timeUtils';

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

describe('timeUtils', () => {
	describe('timeStringToMs', () => {
		describe('12-hour format', () => {
			it('should convert "12:00 AM" (midnight) to 0', () => {
				expect(timeStringToMs('12:00 AM')).toBe(0);
			});

			it('should convert "12:30 AM" to 30 minutes', () => {
				expect(timeStringToMs('12:30 AM')).toBe(30 * MS_PER_MINUTE);
			});

			it('should convert "1:00 AM" to 1 hour', () => {
				expect(timeStringToMs('1:00 AM')).toBe(1 * MS_PER_HOUR);
			});

			it('should convert "12:00 PM" (noon) to 12 hours', () => {
				expect(timeStringToMs('12:00 PM')).toBe(12 * MS_PER_HOUR);
			});

			it('should convert "1:00 PM" to 13 hours', () => {
				expect(timeStringToMs('1:00 PM')).toBe(13 * MS_PER_HOUR);
			});

			it('should convert "10:00 PM" to 22 hours', () => {
				expect(timeStringToMs('10:00 PM')).toBe(22 * MS_PER_HOUR);
			});

			it('should convert "11:59 PM" to 23 hours 59 minutes', () => {
				expect(timeStringToMs('11:59 PM')).toBe(23 * MS_PER_HOUR + 59 * MS_PER_MINUTE);
			});

			it('should handle lowercase "am/pm"', () => {
				expect(timeStringToMs('10:00 pm')).toBe(22 * MS_PER_HOUR);
				expect(timeStringToMs('6:00 am')).toBe(6 * MS_PER_HOUR);
			});

			it('should handle single digit minutes like "10:0 pm"', () => {
				expect(timeStringToMs('10:0 pm')).toBe(22 * MS_PER_HOUR);
			});

			it('should handle single digit hours', () => {
				expect(timeStringToMs('6:30 AM')).toBe(6 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
			});
		});

		describe('24-hour format', () => {
			it('should convert "00:00:00" (midnight) to 0', () => {
				expect(timeStringToMs('00:00:00')).toBe(0);
			});

			it('should convert "00:00" (midnight without seconds) to 0', () => {
				expect(timeStringToMs('00:00')).toBe(0);
			});

			it('should convert "22:00:00" to 22 hours', () => {
				expect(timeStringToMs('22:00:00')).toBe(22 * MS_PER_HOUR);
			});

			it('should convert "14:30:00" to 14 hours 30 minutes', () => {
				expect(timeStringToMs('14:30:00')).toBe(14 * MS_PER_HOUR + 30 * MS_PER_MINUTE);
			});

			it('should convert "06:00" to 6 hours', () => {
				expect(timeStringToMs('06:00')).toBe(6 * MS_PER_HOUR);
			});

			it('should handle seconds', () => {
				expect(timeStringToMs('10:30:45')).toBe(10 * MS_PER_HOUR + 30 * MS_PER_MINUTE + 45 * 1000);
			});
		});

		describe('edge cases', () => {
			it('should return 0 for empty string', () => {
				expect(timeStringToMs('')).toBe(0);
			});

			it('should return 0 for invalid format', () => {
				expect(timeStringToMs('invalid')).toBe(0);
			});

			it('should return 0 for out-of-range values', () => {
				expect(timeStringToMs('25:00')).toBe(0); // Invalid hour (max is 23)
				expect(timeStringToMs('23:60')).toBe(0); // Invalid minutes (max is 59)
				expect(timeStringToMs('13:00 AM')).toBe(0); // Invalid 12-hour (max is 12)
				expect(timeStringToMs('0:00 AM')).toBe(0); // Invalid 12-hour (min is 1)
			});
		});
	});

	describe('msToTimeString', () => {
		it('should convert 0 to "12:00 AM"', () => {
			expect(msToTimeString(0)).toBe('12:00 AM');
		});

		it('should convert 6 hours to "6:00 AM"', () => {
			expect(msToTimeString(6 * MS_PER_HOUR)).toBe('6:00 AM');
		});

		it('should convert 12 hours to "12:00 PM"', () => {
			expect(msToTimeString(12 * MS_PER_HOUR)).toBe('12:00 PM');
		});

		it('should convert 22 hours to "10:00 PM"', () => {
			expect(msToTimeString(22 * MS_PER_HOUR)).toBe('10:00 PM');
		});

		it('should convert 22 hours 30 minutes to "10:30 PM"', () => {
			expect(msToTimeString(22 * MS_PER_HOUR + 30 * MS_PER_MINUTE)).toBe('10:30 PM');
		});

		it('should handle values over 24 hours by wrapping', () => {
			expect(msToTimeString(26 * MS_PER_HOUR)).toBe('2:00 AM');
		});

		it('should handle negative values by wrapping', () => {
			expect(msToTimeString(-2 * MS_PER_HOUR)).toBe('10:00 PM');
		});
	});

	describe('normalizeTimeString', () => {
		it('should normalize "22:00:00" to "10:00 PM"', () => {
			expect(normalizeTimeString('22:00:00')).toBe('10:00 PM');
		});

		it('should normalize "10:0 pm" to "10:00 PM"', () => {
			expect(normalizeTimeString('10:0 pm')).toBe('10:00 PM');
		});

		it('should keep "10:00 PM" as "10:00 PM"', () => {
			expect(normalizeTimeString('10:00 PM')).toBe('10:00 PM');
		});

		it('should normalize "06:00" to "6:00 AM"', () => {
			expect(normalizeTimeString('06:00')).toBe('6:00 AM');
		});

		it('should normalize "14:30:00" to "2:30 PM"', () => {
			expect(normalizeTimeString('14:30:00')).toBe('2:30 PM');
		});

		it('should return empty string for empty input', () => {
			expect(normalizeTimeString('')).toBe('');
		});

		it('should return empty string for invalid input', () => {
			expect(normalizeTimeString('invalid')).toBe('');
		});

		it('should handle midnight "00:00:00" correctly', () => {
			expect(normalizeTimeString('00:00:00')).toBe('12:00 AM');
		});

		it('should handle "12:00 AM" correctly', () => {
			expect(normalizeTimeString('12:00 AM')).toBe('12:00 AM');
		});
	});

	describe('calculateSleepDurationMs', () => {
		describe('same day sleep (unlikely but valid)', () => {
			it('should calculate duration when end is after start', () => {
				// 6:00 AM to 8:00 AM = 2 hours (nap scenario)
				expect(calculateSleepDurationMs('6:00 AM', '8:00 AM')).toBe(2 * MS_PER_HOUR);
			});
		});

		describe('overnight sleep (typical scenario)', () => {
			it('should calculate overnight duration: 10:00 PM to 6:00 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('10:00 PM', '6:00 AM')).toBe(8 * MS_PER_HOUR);
			});

			it('should calculate overnight duration: 11:00 PM to 7:00 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('11:00 PM', '7:00 AM')).toBe(8 * MS_PER_HOUR);
			});

			it('should calculate overnight duration: 9:30 PM to 5:30 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('9:30 PM', '5:30 AM')).toBe(8 * MS_PER_HOUR);
			});

			it('should calculate short sleep: 2:00 AM to 6:00 AM = 4 hours', () => {
				expect(calculateSleepDurationMs('2:00 AM', '6:00 AM')).toBe(4 * MS_PER_HOUR);
			});
		});

		describe('sleep starting after midnight', () => {
			it('should calculate duration: 1:00 AM to 9:00 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('1:00 AM', '9:00 AM')).toBe(8 * MS_PER_HOUR);
			});

			it('should calculate duration: 2:30 AM to 10:30 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('2:30 AM', '10:30 AM')).toBe(8 * MS_PER_HOUR);
			});

			it('should calculate duration: 3:00 AM to 11:00 AM = 8 hours', () => {
				expect(calculateSleepDurationMs('3:00 AM', '11:00 AM')).toBe(8 * MS_PER_HOUR);
			});
		});

		describe('edge cases', () => {
			it('should return 0 when start time is empty', () => {
				expect(calculateSleepDurationMs('', '6:00 AM')).toBe(0);
			});

			it('should return 0 when end time is empty', () => {
				expect(calculateSleepDurationMs('10:00 PM', '')).toBe(0);
			});

			it('should return 0 when both are empty', () => {
				expect(calculateSleepDurationMs('', '')).toBe(0);
			});

			it('should handle midnight to midnight (24 hours)', () => {
				// Same time means 0 duration (same day)
				expect(calculateSleepDurationMs('12:00 AM', '12:00 AM')).toBe(0);
			});
		});
	});

	describe('calculateBedTimeStart', () => {
		it('should calculate start time: end 6:00 AM, duration 8 hours = 10:00 PM', () => {
			expect(calculateBedTimeStart('6:00 AM', 8 * MS_PER_HOUR)).toBe('10:00 PM');
		});

		it('should calculate start time: end 7:00 AM, duration 8 hours = 11:00 PM', () => {
			expect(calculateBedTimeStart('7:00 AM', 8 * MS_PER_HOUR)).toBe('11:00 PM');
		});

		it('should calculate start time: end 10:00 AM, duration 8 hours = 2:00 AM', () => {
			expect(calculateBedTimeStart('10:00 AM', 8 * MS_PER_HOUR)).toBe('2:00 AM');
		});

		it('should return empty string when end time is empty', () => {
			expect(calculateBedTimeStart('', 8 * MS_PER_HOUR)).toBe('');
		});

		it('should return empty string when duration is 0', () => {
			expect(calculateBedTimeStart('6:00 AM', 0)).toBe('');
		});

		it('should return empty string when duration is negative', () => {
			expect(calculateBedTimeStart('6:00 AM', -1)).toBe('');
		});
	});

	describe('calculateBedTimeEnd', () => {
		it('should calculate end time: start 10:00 PM, duration 8 hours = 6:00 AM', () => {
			expect(calculateBedTimeEnd('10:00 PM', 8 * MS_PER_HOUR)).toBe('6:00 AM');
		});

		it('should calculate end time: start 11:00 PM, duration 8 hours = 7:00 AM', () => {
			expect(calculateBedTimeEnd('11:00 PM', 8 * MS_PER_HOUR)).toBe('7:00 AM');
		});

		it('should calculate end time: start 2:00 AM, duration 8 hours = 10:00 AM', () => {
			expect(calculateBedTimeEnd('2:00 AM', 8 * MS_PER_HOUR)).toBe('10:00 AM');
		});

		it('should calculate end time: start 10:30 PM, duration 8 hours = 6:30 AM', () => {
			expect(calculateBedTimeEnd('10:30 PM', 8 * MS_PER_HOUR)).toBe('6:30 AM');
		});

		it('should handle wrap around midnight correctly', () => {
			// Start at 11:00 PM, sleep 4 hours = wake at 3:00 AM
			expect(calculateBedTimeEnd('11:00 PM', 4 * MS_PER_HOUR)).toBe('3:00 AM');
		});

		it('should return empty string when start time is empty', () => {
			expect(calculateBedTimeEnd('', 8 * MS_PER_HOUR)).toBe('');
		});

		it('should return empty string when duration is 0', () => {
			expect(calculateBedTimeEnd('10:00 PM', 0)).toBe('');
		});

		it('should return empty string when duration is negative', () => {
			expect(calculateBedTimeEnd('10:00 PM', -1)).toBe('');
		});
	});

	describe('round-trip conversions', () => {
		it('should maintain consistency: parse -> format -> parse', () => {
			const times = ['10:00 PM', '6:00 AM', '12:00 PM', '12:00 AM', '3:30 PM'];
			times.forEach((time) => {
				const ms = timeStringToMs(time);
				const formatted = msToTimeString(ms);
				const ms2 = timeStringToMs(formatted);
				expect(ms2).toBe(ms);
			});
		});

		it('should normalize and maintain value', () => {
			const testCases = [
				{ input: '22:00:00', expected: '10:00 PM' },
				{ input: '10:0 pm', expected: '10:00 PM' },
				{ input: '06:30', expected: '6:30 AM' },
			];
			testCases.forEach(({ input, expected }) => {
				const normalized = normalizeTimeString(input);
				expect(normalized).toBe(expected);
				// Verify the ms value is the same
				expect(timeStringToMs(input)).toBe(timeStringToMs(normalized));
			});
		});
	});
});
