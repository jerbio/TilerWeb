import dayjs from 'dayjs';
import {
	formatDeadlineDate,
	formatDetailDate,
	formatDetailTime,
	formatDuration,
	formatMinutes,
} from './tileshareDate';

const epoch = dayjs('2025-07-27T17:05:00').valueOf();

describe('TileShare locale formatting', () => {
	it.each(['en-US', 'fr', 'de', 'ja', 'hi'])('uses %s date and clock conventions', (locale) => {
		expect(formatDetailDate(epoch, locale)).toBe(
			new Intl.DateTimeFormat(locale, {
				weekday: 'short',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			}).format(epoch)
		);
		expect(formatDetailTime(epoch, locale)).toBe(
			new Intl.DateTimeFormat(locale, {
				timeStyle: 'short',
			}).format(epoch)
		);
	});
	it('uses translated month names and locale date order', () => {
		expect(formatDetailDate(epoch, 'en-US')).toBe('Sun, July 27, 2025');
		expect(formatDetailDate(epoch, 'fr')).toBe('dim. 27 juillet 2025');
	});
	it.each([null, undefined, NaN, Infinity, 9e15])('handles an unavailable date: %s', (value) => {
		expect(formatDetailDate(value)).toBe('—');
		expect(formatDetailTime(value)).toBe('—');
	});
	it('does not treat the Unix epoch as missing', () => {
		expect(formatDetailDate(0)).not.toBe('—');
		expect(formatDetailTime(0)).not.toBe('—');
	});
	it('formats minute units with locale plural and decimal rules', () => {
		expect(formatMinutes(60000, 'en')).toBe('1 minute');
		expect(formatMinutes(120000, 'en')).toBe('2 minutes');
		expect(formatMinutes(90000, 'de')).toBe('1,5 Minuten');
		expect(formatMinutes(120000, 'ja')).toBe('2 分');
	});
	it('localizes date-only warnings without shifting the calendar day', () => {
		expect(formatDeadlineDate('2026-11-17', 'en-US')).toBe('November 17, 2026');
		expect(formatDeadlineDate('2026-11-17', 'fr')).toBe('17 novembre 2026');
		expect(formatDeadlineDate('2026-11-17', 'ja')).toBe('2026年11月17日');
	});
	it.each(['', '2026-02-30', '2026-13-01', 'invalid', '2026-11-17T00:00:00Z'])(
		'does not invent a deadline for invalid date-only input: %s',
		(value) => {
			expect(formatDeadlineDate(value, 'fr')).toBe('—');
		}
	);
	it('uses locale unit grammar for hours and minutes', () => {
		expect(formatDuration(3600000, 'en')).toBe('1 hour');
		expect(formatDuration(7200000, 'en')).toBe('2 hours');
		expect(formatDuration(3600000, 'fr')).toBe('1\u00a0heure');
		expect(formatDuration(90000, 'de')).toBe('1,5 Minuten');
	});
});
