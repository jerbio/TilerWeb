import dayjs from 'dayjs';

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
export function validateTimeRange(
	date: string,
	startTime: string,
	endTime: string
): boolean {
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
