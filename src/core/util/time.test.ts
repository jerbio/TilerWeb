import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import dayjs from 'dayjs';
import TimeUtil from './time';

describe('TimeUtil', () => {
	describe('rangeDuration', () => {
		it('returns "0m" for zero duration', () => {
			const time = dayjs('2024-01-01T10:00:00');
			expect(TimeUtil.rangeDuration(time, time)).toBe('0m');
		});

		it('returns minutes only for durations under 1 hour', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T10:30:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('30m');
		});

		it('returns hours and minutes for durations under 1 day', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T12:30:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('2h 30m');
		});

		it('returns days, hours, minutes for multi-day durations', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-03T14:45:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('2d 4h 45m');
		});

		it('returns weeks for durations 7+ days', () => {
			const start = dayjs('2024-01-01T00:00:00');
			const end = dayjs('2024-01-10T03:15:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('1w 2d 3h 15m');
		});

		it('rounds up partial minutes (ceils seconds)', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T10:00:30'); // 30 seconds
			expect(TimeUtil.rangeDuration(start, end)).toBe('1m');
		});

		it('handles exact hour boundaries', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T13:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('3h');
		});

		it('handles exact day boundaries', () => {
			const start = dayjs('2024-01-01T00:00:00');
			const end = dayjs('2024-01-03T00:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('2d');
		});

		it('handles exact week boundaries', () => {
			const start = dayjs('2024-01-01T00:00:00');
			const end = dayjs('2024-01-15T00:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('2w');
		});

		it('handles 1 minute duration', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T10:01:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('1m');
		});

		it('handles 1 hour duration', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-01T11:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('1h');
		});

		it('handles 1 day duration', () => {
			const start = dayjs('2024-01-01T10:00:00');
			const end = dayjs('2024-01-02T10:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('1d');
		});

		it('handles 1 week duration', () => {
			const start = dayjs('2024-01-01T00:00:00');
			const end = dayjs('2024-01-08T00:00:00');
			expect(TimeUtil.rangeDuration(start, end)).toBe('1w');
		});
	});

	describe('inMilliseconds', () => {
		it('converts minutes to milliseconds', () => {
			expect(TimeUtil.inMilliseconds(1, 'm')).toBe(60 * 1000);
			expect(TimeUtil.inMilliseconds(30, 'm')).toBe(30 * 60 * 1000);
		});

		it('converts hours to milliseconds', () => {
			expect(TimeUtil.inMilliseconds(1, 'h')).toBe(60 * 60 * 1000);
			expect(TimeUtil.inMilliseconds(24, 'h')).toBe(24 * 60 * 60 * 1000);
		});

		it('converts days to milliseconds', () => {
			expect(TimeUtil.inMilliseconds(1, 'd')).toBe(24 * 60 * 60 * 1000);
			expect(TimeUtil.inMilliseconds(7, 'd')).toBe(7 * 24 * 60 * 60 * 1000);
		});

		it('converts weeks to milliseconds', () => {
			expect(TimeUtil.inMilliseconds(1, 'w')).toBe(7 * 24 * 60 * 60 * 1000);
			expect(TimeUtil.inMilliseconds(2, 'w')).toBe(2 * 7 * 24 * 60 * 60 * 1000);
		});

		it('handles zero value', () => {
			expect(TimeUtil.inMilliseconds(0, 'm')).toBe(0);
			expect(TimeUtil.inMilliseconds(0, 'h')).toBe(0);
			expect(TimeUtil.inMilliseconds(0, 'd')).toBe(0);
			expect(TimeUtil.inMilliseconds(0, 'w')).toBe(0);
		});

		it('handles decimal values', () => {
			expect(TimeUtil.inMilliseconds(1.5, 'h')).toBe(1.5 * 60 * 60 * 1000);
			expect(TimeUtil.inMilliseconds(0.5, 'd')).toBe(0.5 * 24 * 60 * 60 * 1000);
		});

		it('throws error for invalid unit', () => {
			// @ts-expect-error - Testing invalid unit
			expect(() => TimeUtil.inMilliseconds(1, 's')).toThrow('Invalid time unit: s');
			// @ts-expect-error - Testing invalid unit
			expect(() => TimeUtil.inMilliseconds(1, 'invalid')).toThrow(
				'Invalid time unit: invalid'
			);
		});
	});

	describe('time-dependent functions', () => {
		beforeEach(() => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-02-02T12:00:00Z'));
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('now returns mocked timestamp', () => {
			const expected = new Date('2026-02-02T12:00:00Z').getTime();
			expect(TimeUtil.now()).toBe(expected);
		});

		it('nowDayjs returns mocked dayjs instance', () => {
			const result = TimeUtil.nowDayjs();
			expect(result.year()).toBe(2026);
			expect(result.month()).toBe(1); // February (0-indexed)
			expect(result.date()).toBe(2);
		});

		it('nowISO returns mocked ISO string', () => {
			expect(TimeUtil.nowISO()).toBe('2026-02-02T12:00:00.000Z');
		});

		it('currentYear returns mocked year', () => {
			expect(TimeUtil.currentYear()).toBe(2026);
		});
	});
});
