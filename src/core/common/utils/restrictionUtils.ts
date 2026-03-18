import type { RestrictionProfile, WeekDayOption, DaySchedule } from '@/core/common/types/schedule';
import { msToTimeString } from '@/core/common/utils/timeUtils';

/**
 * Converts a RestrictionProfile from the API into a DaySchedule array for the WeeklySchedule component.
 * Returns 7 entries (Sun-Sat), with empty strings for days without restrictions.
 */
export const restrictionProfileToSchedule = (profile: RestrictionProfile | null | undefined): DaySchedule[] => {
	const empty: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
		dayIndex: i,
		startTime: '',
		endTime: '',
	}));

	if (!profile) return empty;

	const { daySelection } = profile;
	if (!daySelection) return empty;

	for (let i = 0; i < 7; i++) {
		const entry = daySelection[i];
		if (!entry) continue;

		const { restrictionTimeLine } = entry;
		if (!restrictionTimeLine) continue;

		empty[i] = {
			dayIndex: i,
			startTime: restrictionTimeLine.start != null ? msToTimeString(restrictionTimeLine.start) : '',
			endTime: restrictionTimeLine.end != null ? msToTimeString(restrictionTimeLine.end) : '',
		};
	}

	return empty;
};

/**
 * Converts a DaySchedule array back into WeekDayOption[] for the API POST request.
 * Only includes days where both startTime and endTime are set.
 */
export const scheduleToWeekDayOptions = (schedule: DaySchedule[]): WeekDayOption[] => {
	return schedule
		.filter((day) => day.startTime && day.endTime)
		.map((day) => ({
			Index: String(day.dayIndex),
			Start: day.startTime,
			End: day.endTime,
		}));
};

/**
 * Returns true if any day in the schedule has both startTime and endTime set.
 */
export const isScheduleActive = (schedule: DaySchedule[]): boolean => {
	return schedule.some((day) => day.startTime && day.endTime);
};
