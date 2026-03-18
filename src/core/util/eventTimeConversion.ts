import dayjs from 'dayjs';
import TimeUtil from './time';

/**
 * Converts YYYY-MM-DD date and "h:mm A" time (in local timezone) to unix timestamp (milliseconds).
 * The returned timestamp is UTC (as all unix timestamps are).
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in "h:mm A" format (e.g., "10:30 AM", "2:00 PM")
 * @returns Unix timestamp in milliseconds (UTC)
 */
export function dateTimeToUnix(date: string, time: string): number {
	const [timePart, period] = time.split(' ');
	const [hourStr, minuteStr] = timePart.split(':');
	let hour = parseInt(hourStr, 10);
	const minute = parseInt(minuteStr, 10);

	// Convert to 24-hour format
	if (period === 'PM' && hour !== 12) {
		hour += 12;
	} else if (period === 'AM' && hour === 12) {
		hour = 0;
	}

	// dayjs interprets the date/time in local timezone and valueOf() returns UTC timestamp
	return dayjs(date).hour(hour).minute(minute).second(0).millisecond(0).valueOf();
}

/**
 * Converts unix timestamp to YYYY-MM-DD format in local timezone
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Date string in YYYY-MM-DD format (local timezone)
 */
export function timeToDate(timestamp: number): string {
	return dayjs(timestamp).format('YYYY-MM-DD');
}

/**
 * Converts unix timestamp to "h:mm A" format in local timezone (matching TimeDropdown format)
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Time string in "h:mm A" format (e.g., "10:30 AM") in local timezone
 */
export function unixToTimeString(timestamp: number): string {
	return dayjs(timestamp).format('h:mm A');
}

/**
 * Validates that end time is after start time on the same date
 * @param date - Date string in YYYY-MM-DD format
 * @param startTime - Start time in "h:mm A" format
 * @param endTime - End time in "h:mm A" format
 * @returns true if end time is after start time
 */
export function validateTimeRange(date: string, startTime: string, endTime: string): boolean {
	const startUnix = dateTimeToUnix(date, startTime);
	const endUnix = dateTimeToUnix(date, endTime);
	return endUnix > startUnix;
}

/**
 * Validates that end datetime is after start datetime (supports different dates).
 * Use this for multi-day event validation where start and end dates may differ.
 * @param startDate - Start date in YYYY-MM-DD format
 * @param startTime - Start time in "h:mm A" format
 * @param endDate - End date in YYYY-MM-DD format
 * @param endTime - End time in "h:mm A" format
 * @returns true if end datetime is strictly after start datetime
 */
export function validateDateTimeRange(
	startDate: string,
	startTime: string,
	endDate: string,
	endTime: string
): boolean {
	const startUnix = dateTimeToUnix(startDate, startTime);
	const endUnix = dateTimeToUnix(endDate, endTime);
	return endUnix > startUnix;
}

/**
 * Returns a human-readable "due in" string for an upcoming event.
 * Handles singular/plural for minutes, hours, and days.
 * @param startTimeMs - Event start time as unix timestamp (milliseconds)
 * @param nowMs - Current time as unix timestamp (milliseconds). Defaults to Date.now().
 */
export function formatDueIn(startTimeMs: number, nowMs?: number): string {
	const now = nowMs ?? Date.now();
	const diffMs = startTimeMs - now;
	const diffMinutes = Math.floor(diffMs / 60_000);
	const diffHours = Math.floor(diffMs / 3_600_000);
	const diffDays = Math.floor(diffMs / 86_400_000);

	if (diffHours < 1) {
		return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'}`;
	} else if (diffHours < 24) {
		return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'}`;
	} else {
		return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
	}
}

/**
 * Calculates a human-readable duration string from start/end date+time strings.
 * When the end time is before the start time on the same date, assumes the end
 * crosses midnight and adds 24 hours.
 */
export function calculateDuration(
	startDate: string,
	startTime: string,
	endDate: string,
	endTime: string
): string {
	const startUnix = dateTimeToUnix(startDate, startTime);
	let endUnix = dateTimeToUnix(endDate, endTime);

	if (endUnix <= startUnix && startDate === endDate) {
		// End time crosses midnight — advance end by 24 hours
		endUnix += 24 * 60 * 60 * 1000;
	}

	return TimeUtil.rangeDuration(dayjs(startUnix), dayjs(endUnix));
}

/**
 * Adjusts the end date/time to preserve the original duration when the start changes.
 * Computes duration between old start and old end, then applies it to the new start.
 */
export function adjustEndDateTime(
	oldStartDate: string,
	oldStartTime: string,
	newStartDate: string,
	newStartTime: string,
	oldEndDate: string,
	oldEndTime: string
): { endDate: string; endTime: string } {
	const oldStartUnix = dateTimeToUnix(oldStartDate, oldStartTime);
	const oldEndUnix = dateTimeToUnix(oldEndDate, oldEndTime);
	const duration = oldEndUnix - oldStartUnix;

	const newStartUnix = dateTimeToUnix(newStartDate, newStartTime);
	const newEndUnix = newStartUnix + duration;

	return {
		endDate: timeToDate(newEndUnix),
		endTime: unixToTimeString(newEndUnix),
	};
}
