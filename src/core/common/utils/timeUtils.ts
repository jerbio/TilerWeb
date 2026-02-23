/**
 * Milliseconds in common time units
 */
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

/**
 * Converts a time string to milliseconds since midnight
 * Handles various formats:
 * - 12-hour: "5:00 AM", "10:30 PM", "10:0 pm"
 * - 24-hour: "22:00:00", "14:30:00", "22:00"
 */
export const timeStringToMs = (timeString: string): number => {
	if (!timeString) return 0;

	// Try 12-hour format first: "10:00 PM", "10:0 pm", "5:30 AM", etc.
	const match12 = timeString.match(/^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i);
	if (match12) {
		let hours = parseInt(match12[1], 10);
		const minutes = parseInt(match12[2], 10);
		const period = match12[3].toUpperCase();

		// Validate ranges: hours 1-12 for 12-hour format, minutes 0-59
		if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
			return 0;
		}

		// Convert to 24-hour format
		if (period === 'AM' && hours === 12) {
			hours = 0;
		} else if (period === 'PM' && hours !== 12) {
			hours += 12;
		}

		return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE;
	}

	// Try 24-hour format: "22:00:00", "14:30:00", "22:00"
	const match24 = timeString.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
	if (match24) {
		const hours = parseInt(match24[1], 10);
		const minutes = parseInt(match24[2], 10);
		const seconds = match24[3] ? parseInt(match24[3], 10) : 0;

		// Validate ranges: hours 0-23, minutes 0-59, seconds 0-59
		if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
			return 0;
		}

		return hours * MS_PER_HOUR + minutes * MS_PER_MINUTE + seconds * 1000;
	}

	return 0;
};

/**
 * Normalizes any time string format to standard dropdown format (e.g., "10:00 PM")
 * Handles: "22:00:00", "10:0 pm", "10:00 PM" -> "10:00 PM"
 */
export const normalizeTimeString = (timeString: string): string => {
	if (!timeString) return '';

	// Check if the input matches any valid format before converting
	const is12Hour = /^(\d{1,2}):(\d{1,2})\s*(AM|PM)$/i.test(timeString);
	const is24Hour = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.test(timeString);

	if (!is12Hour && !is24Hour) {
		return '';
	}

	const ms = timeStringToMs(timeString);
	return msToTimeString(ms);
};

/**
 * Converts milliseconds since midnight to a time string (e.g., "5:00 AM", "10:30 PM")
 */
export const msToTimeString = (ms: number): string => {
	if (ms < 0 || ms >= MS_PER_DAY) {
		// Normalize to within a day
		ms = ((ms % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;
	}

	const totalMinutes = Math.floor(ms / MS_PER_MINUTE);
	const hours24 = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	const period = hours24 >= 12 ? 'PM' : 'AM';
	const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;

	return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

/**
 * Calculates sleep duration in milliseconds from bed time start and end
 * Handles overnight sleep (e.g., 10:00 PM to 6:00 AM)
 */
export const calculateSleepDurationMs = (bedTimeStart: string, bedTimeEnd: string): number => {
	if (!bedTimeStart || !bedTimeEnd) return 0;

	const startMs = timeStringToMs(bedTimeStart);
	const endMs = timeStringToMs(bedTimeEnd);

	// If end time is after or equal to start time, it's same day (unlikely for sleep)
	// If end time is before start time, it's overnight (typical sleep pattern)
	if (endMs >= startMs) {
		return endMs - startMs;
	} else {
		// Overnight: add 24 hours to end time
		return MS_PER_DAY - startMs + endMs;
	}
};

/**
 * Calculates bed time start from end time and sleep duration
 */
export const calculateBedTimeStart = (bedTimeEnd: string, sleepDurationMs: number): string => {
	if (!bedTimeEnd || sleepDurationMs <= 0) return '';

	const endMs = timeStringToMs(bedTimeEnd);
	let startMs = endMs - sleepDurationMs;

	// Normalize to within a day (handle negative values for overnight)
	startMs = ((startMs % MS_PER_DAY) + MS_PER_DAY) % MS_PER_DAY;

	return msToTimeString(startMs);
};

/**
 * Calculates bed time end (wake up time) from start time and sleep duration
 */
export const calculateBedTimeEnd = (bedTimeStart: string, sleepDurationMs: number): string => {
	if (!bedTimeStart || sleepDurationMs <= 0) return '';

	const startMs = timeStringToMs(bedTimeStart);
	let endMs = startMs + sleepDurationMs;

	// Normalize to within a day (handle overflow past midnight)
	endMs = endMs % MS_PER_DAY;

	return msToTimeString(endMs);
};
