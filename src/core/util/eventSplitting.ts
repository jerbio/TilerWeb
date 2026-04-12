import dayjs from 'dayjs';
import { SubCalendarEvent } from '../common/types/schedule';

export type SplitEvent = SubCalendarEvent & {
	key: string;
	originalStart: number;
	originalEnd: number;
};

/**
 * Splits multi-day events into separate visual segments for calendar display.
 * Preserves originalStart/originalEnd on each segment so the actual event times
 * can be retrieved even after visual splitting.
 *
 * @param event - The event to potentially split
 * @returns Array of event segments (single element for same-day events, multiple for multi-day)
 */
export function splitEventByDay(event: SubCalendarEvent): SplitEvent[] {
	const start = dayjs(event.start);
	let end = dayjs(event.end);

	// Treat midnight as still part of previous day
	if (end.hour() === 0 && end.minute() === 0 && end.second() === 0) {
		end = end.subtract(1, 'millisecond');
	}

	// Preserve original times before splitting
	const originalStart = event.start;
	const originalEnd = event.end;

	// If event is within a single day, return it with preserved times
	if (start.isSame(end, 'day')) {
		return [
			{
				...event,
				key: event.id,
				originalStart,
				originalEnd,
			},
		];
	}

	// Multi-day event: split into segments
	const segments: SplitEvent[] = [];
	const days = end.endOf('day').diff(start.startOf('day'), 'day') + 1;

	for (let i = 0; i < days; i++) {
		const day = start.add(i, 'day');
		segments.push({
			...event,
			key: `${event.id}-${i}`,
			// First segment keeps original start, others start at midnight
			start: i === 0 ? start.unix() * 1000 : day.startOf('day').unix() * 1000,
			// Last segment keeps original end, others end at 23:59:59
			end: i === days - 1 ? end.unix() * 1000 : day.endOf('day').unix() * 1000,
			originalStart,
			originalEnd,
		});
	}

	return segments;
}
