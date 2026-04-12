import { ScheduleSubCalendarEvent } from '../common/types/schedule';

/** Threshold in milliseconds: 15 hours */
export const LONG_DURATION_THRESHOLD_MS = 15 * 60 * 60 * 1000;

/**
 * Returns true when a calendar event spans more than 15 hours **and**
 * is NOT a procrastinate-type event.
 *
 * Uses `originalStart` / `originalEnd` when available (i.e. after
 * `splitEventByDay`) so that **every** day-segment of a long event is
 * classified consistently — even short segments produced by midnight
 * splitting.
 *
 * Long-duration events that meet this criteria are rendered in a
 * compact list overlay rather than as a tall tile on the calendar grid.
 */
export function isLongDurationEvent(event: ScheduleSubCalendarEvent): boolean {
	const start = event.originalStart ?? event.start;
	const end = event.originalEnd ?? event.end;
	const duration = end - start;
	return duration > LONG_DURATION_THRESHOLD_MS && !event.isProcrastinateEvent;
}
