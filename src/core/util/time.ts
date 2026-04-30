import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/fr';
import 'dayjs/locale/pl';
import 'dayjs/locale/es';
import 'dayjs/locale/de';
import 'dayjs/locale/ru';
import 'dayjs/locale/it';
import 'dayjs/locale/el';
import 'dayjs/locale/zh';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/hi';

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

type TimeUnit = 'w' | 'd' | 'h' | 'm';
const _quantities: Record<TimeUnit, number> = {
	w: 7 * 24 * 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	h: 60 * 60 * 1000,
	m: 60 * 1000,
} as const;

class TimeUtil {
	/**
	 * Calculates the duration (in minutes) between two 12-hour time strings
	 * on given Dayjs dates.
	 *
	 * Internally converts both times to minutes since midnight and applies them
	 * to the provided dates before computing the difference.
	 *
	 * @param startTime - Start time in 12-hour format (e.g. "10:30 AM")
	 * @param endTime - End time in 12-hour format (e.g. "2:15 PM")
	 * @param start - Base start date
	 * @param end - Base end date
	 * @returns Duration in minutes (can be negative if end < start)
	 */
	static minutesBetweenMeridians(
		startTime: string,
		endTime: string,
		startDay: dayjs.Dayjs,
		endDay: dayjs.Dayjs
	): number {
		const startInMinutes = this.meridianToMinutesFromStartOfDay(startTime);
		const endInMinutes = this.meridianToMinutesFromStartOfDay(endTime);
		startDay = dayjs(startDay)
			.set('hour', Math.floor(startInMinutes / 60))
			.set('minute', startInMinutes % 60);
		endDay = dayjs(endDay)
			.set('hour', Math.floor(endInMinutes / 60))
			.set('minute', endInMinutes % 60);
		const duration = endDay.diff(startDay, 'minutes');
		return duration;
	}

	/**
	 * Converts minutes since midnight into a 12-hour time string (AM/PM).
	 *
	 * @param minutes - Minutes since midnight (0 = 12:00 AM, 720 = 12:00 PM)
	 * @returns Formatted time string (e.g. "3:05 PM")
	 */
	static minutesFromStartOfDayToMeridian(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		const period = hours >= 12 ? 'PM' : 'AM';
		const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
		const displayMinutes = mins.toString().padStart(2, '0');

		if (mins === 0) {
			return `${displayHour}:00 ${period}`;
		} else {
			return `${displayHour}:${displayMinutes} ${period}`;
		}
	}

	/**
	 * Converts a 12-hour time string (AM/PM) into minutes since midnight.
	 * @param time - Time string in 12-hour format (e.g. "3:05 PM")
	 * @returns Total minutes since midnight
	 */
	static meridianToMinutesFromStartOfDay(time: string): number {
		const [timeStr, meridian] = time.split(' ');
		const [hourStr, minuteStr] = timeStr.split(':');
		let hour = parseInt(hourStr, 10);
		const minute = parseInt(minuteStr, 10);

		if (meridian === 'PM' && hour !== 12) {
			hour += 12;
		} else if (meridian === 'AM' && hour === 12) {
			hour = 0;
		}
		return hour * 60 + minute;
	}

	/**
	 * Formats a duration in minutes into a human-readable string
	 * using weeks, days, hours, and minutes.
	 *
	 * Example: 1500 → "1d 1h"
	 *
	 * @param minutes - Duration in minutes
	 * @returns Formatted duration string (e.g. "2h 30m", "1w 2d")
	 */
	static minutesToDuration(minutes: number): string {
		const quantitiesInMins = Object.entries(_quantities).map(
			([unit, quantity]) => [unit, quantity / (60 * 1000)] as [TimeUnit, number]
		);

		const parts = quantitiesInMins
			.map(([unit, divisor]) => {
				const value = Math.floor(minutes / divisor);
				if (value > 0) {
					minutes -= value * divisor;
					return `${value}${unit}`;
				}
				return '';
			})
			.filter(Boolean);

		return parts.join(' ') || '0m';
	}

	static rangeDuration(start: dayjs.Dayjs, end: dayjs.Dayjs): string {
		const totalSeconds = end.diff(start, 'second');
		const totalMinutes = Math.ceil(totalSeconds / 60);

		return this.minutesToDuration(totalMinutes);
	}

	static inMilliseconds(value: number, unit: TimeUnit): number {
		if (!(unit in _quantities)) {
			throw new Error(`Invalid time unit: ${unit}`);
		}
		return value * _quantities[unit];
	}

	static now(): number {
		return Date.now();
	}

	static nowDayjs(): dayjs.Dayjs {
		return dayjs();
	}

	static nowISO(): string {
		return new Date(TimeUtil.now()).toISOString();
	}

	static currentYear(): number {
		return new Date(TimeUtil.now()).getFullYear();
	}

	/**
	 * Sets the dayjs locale to match the app's current language.
	 * Call this when the user changes language.
	 */
	static setLocale(locale: string): void {
		dayjs.locale(locale);
	}

	/**
	 * Formats a timestamp (in ms) as a localized relative time string.
	 * Uses dayjs relativeTime plugin — automatically handles i18n.
	 * e.g. "a few seconds ago", "5 minutes ago", "3 hours ago", "2 days ago"
	 */
	static relativeTime(timestampMs: number): string {
		return dayjs(timestampMs).fromNow();
	}
}

export default TimeUtil;
