import { describe, it, expect } from 'vitest';
import {
	restrictionProfileToSchedule,
	scheduleToWeekDayOptions,
	isScheduleActive,
} from '@/core/common/utils/restrictionUtils';
import type { RestrictionProfile, DaySchedule, DaySelection } from '@/core/common/types/schedule';

const makeProfile = (daySelections: (DaySelection | null)[]): RestrictionProfile => ({
	id: 'profile-id',
	isEnabled: true,
	timeZone: 'America/Denver',
	daySelection: daySelections,
});

describe('restrictionUtils', () => {
	describe('restrictionProfileToSchedule', () => {
		it('converts a full 7-day restriction profile to DaySchedule[]', () => {
			const profile = makeProfile([
				{
					id: 's',
					weekday: 0,
					restrictionTimeLine: {
						id: 'st',
						start: 0,
						duration: 86400000,
						end: 0,
						timeZone: 'America/Denver',
					},
					timeZone: 'America/Denver',
				},
				{
					id: 'm',
					weekday: 1,
					restrictionTimeLine: {
						id: 'mt',
						start: 28800000,
						duration: 36000000,
						end: 64800000,
						timeZone: 'America/Denver',
					},
					timeZone: 'America/Denver',
				},
				null,
				null,
				null,
				null,
				null,
			]);

			const result = restrictionProfileToSchedule(profile);

			expect(result).toHaveLength(7);
			// Sunday: start=0ms => 12:00 AM, end=0 => empty (full day)
			expect(result[0].dayIndex).toBe(0);
			expect(result[0].startTime).toBe('12:00 AM');
			expect(result[0].endTime).toBe('12:00 AM');

			// Monday: start=28800000ms (8:00 AM), end=64800000ms (6:00 PM)
			expect(result[1].dayIndex).toBe(1);
			expect(result[1].startTime).toBe('8:00 AM');
			expect(result[1].endTime).toBe('6:00 PM');

			// Tuesday-Saturday: null => empty times
			expect(result[2].startTime).toBe('');
			expect(result[2].endTime).toBe('');
		});

		it('returns all empty when profile is undefined', () => {
			const result = restrictionProfileToSchedule(undefined);

			expect(result).toHaveLength(7);
			result.forEach((day: DaySchedule, i: number) => {
				expect(day.dayIndex).toBe(i);
				expect(day.startTime).toBe('');
				expect(day.endTime).toBe('');
			});
		});

		it('returns all empty when profile is null', () => {
			const result = restrictionProfileToSchedule(null);

			expect(result).toHaveLength(7);
			result.forEach((day: DaySchedule, i: number) => {
				expect(day.dayIndex).toBe(i);
				expect(day.startTime).toBe('');
				expect(day.endTime).toBe('');
			});
		});

		it('returns all empty when daySelection is null', () => {
			const profile: RestrictionProfile = {
				id: 'profile-id',
				isEnabled: true,
				timeZone: 'America/Denver',
				daySelection: null,
			};

			const result = restrictionProfileToSchedule(profile);

			expect(result).toHaveLength(7);
			result.forEach((day: DaySchedule, i: number) => {
				expect(day.dayIndex).toBe(i);
				expect(day.startTime).toBe('');
				expect(day.endTime).toBe('');
			});
		});

		it('handles null restrictionTimeLine in a daySelection entry', () => {
			const profile = makeProfile([
				{ id: 'sun', weekday: 0, restrictionTimeLine: null, timeZone: 'America/Denver' },
				{
					id: 'm',
					weekday: 1,
					restrictionTimeLine: {
						id: 'mt',
						start: 28800000,
						duration: 36000000,
						end: 64800000,
						timeZone: 'America/Denver',
					},
					timeZone: 'America/Denver',
				},
				null,
				null,
				null,
				null,
				null,
			]);

			const result = restrictionProfileToSchedule(profile);

			// Sunday: null restrictionTimeLine => empty times
			expect(result[0].startTime).toBe('');
			expect(result[0].endTime).toBe('');
			// Monday: valid data
			expect(result[1].startTime).toBe('8:00 AM');
			expect(result[1].endTime).toBe('6:00 PM');
		});

		it('handles null start/end in restrictionTimeLine', () => {
			const profile = makeProfile([
				{
					id: 'sun',
					weekday: 0,
					restrictionTimeLine: {
						id: 'st',
						start: null,
						duration: null,
						end: null,
						timeZone: null,
					},
					timeZone: 'America/Denver',
				},
				null,
				null,
				null,
				null,
				null,
				null,
			]);

			const result = restrictionProfileToSchedule(profile);

			expect(result[0].startTime).toBe('');
			expect(result[0].endTime).toBe('');
		});

		it('handles sparse daySelection arrays correctly', () => {
			const profile = makeProfile([
				null,
				null,
				null,
				{
					id: 'w',
					weekday: 3,
					restrictionTimeLine: {
						id: 'wt',
						start: 32400000,
						duration: 28800000,
						end: 61200000,
						timeZone: 'America/Denver',
					},
					timeZone: 'America/Denver',
				},
				null,
				null,
				null,
			]);

			const result = restrictionProfileToSchedule(profile);

			// Wednesday: 32400000 = 9:00 AM, 61200000 = 5:00 PM
			expect(result[3].startTime).toBe('9:00 AM');
			expect(result[3].endTime).toBe('5:00 PM');
		});
	});

	describe('scheduleToWeekDayOptions', () => {
		it('converts DaySchedule[] with times into WeekDayOption[]', () => {
			const schedule: DaySchedule[] = [
				{ dayIndex: 0, startTime: '', endTime: '' },
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
				{ dayIndex: 2, startTime: '9:00 AM', endTime: '5:00 PM' },
				{ dayIndex: 3, startTime: '', endTime: '' },
				{ dayIndex: 4, startTime: '', endTime: '' },
				{ dayIndex: 5, startTime: '8:00 AM', endTime: '6:00 PM' },
				{ dayIndex: 6, startTime: '', endTime: '' },
			];

			const result = scheduleToWeekDayOptions(schedule);

			// Only days with both start and end should be included
			expect(result).toHaveLength(3);
			expect(result[0]).toEqual({ Index: '1', Start: '8:00 AM', End: '6:00 PM' });
			expect(result[1]).toEqual({ Index: '2', Start: '9:00 AM', End: '5:00 PM' });
			expect(result[2]).toEqual({ Index: '5', Start: '8:00 AM', End: '6:00 PM' });
		});

		it('returns empty array when all days have no times', () => {
			const schedule: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
				dayIndex: i,
				startTime: '',
				endTime: '',
			}));

			const result = scheduleToWeekDayOptions(schedule);
			expect(result).toEqual([]);
		});

		it('excludes days with only start or only end', () => {
			const schedule: DaySchedule[] = [
				{ dayIndex: 0, startTime: '8:00 AM', endTime: '' },
				{ dayIndex: 1, startTime: '', endTime: '5:00 PM' },
				{ dayIndex: 2, startTime: '8:00 AM', endTime: '5:00 PM' },
				{ dayIndex: 3, startTime: '', endTime: '' },
				{ dayIndex: 4, startTime: '', endTime: '' },
				{ dayIndex: 5, startTime: '', endTime: '' },
				{ dayIndex: 6, startTime: '', endTime: '' },
			];

			const result = scheduleToWeekDayOptions(schedule);
			expect(result).toHaveLength(1);
			expect(result[0].Index).toBe('2');
		});
	});

	describe('isScheduleActive', () => {
		it('returns true when at least one day has both start and end', () => {
			const schedule: DaySchedule[] = [
				{ dayIndex: 0, startTime: '', endTime: '' },
				{ dayIndex: 1, startTime: '8:00 AM', endTime: '6:00 PM' },
				{ dayIndex: 2, startTime: '', endTime: '' },
				{ dayIndex: 3, startTime: '', endTime: '' },
				{ dayIndex: 4, startTime: '', endTime: '' },
				{ dayIndex: 5, startTime: '', endTime: '' },
				{ dayIndex: 6, startTime: '', endTime: '' },
			];

			expect(isScheduleActive(schedule)).toBe(true);
		});

		it('returns false when all days are empty', () => {
			const schedule: DaySchedule[] = Array.from({ length: 7 }, (_, i) => ({
				dayIndex: i,
				startTime: '',
				endTime: '',
			}));

			expect(isScheduleActive(schedule)).toBe(false);
		});

		it('returns false when days only have partial times', () => {
			const schedule: DaySchedule[] = [
				{ dayIndex: 0, startTime: '8:00 AM', endTime: '' },
				{ dayIndex: 1, startTime: '', endTime: '5:00 PM' },
				{ dayIndex: 2, startTime: '', endTime: '' },
				{ dayIndex: 3, startTime: '', endTime: '' },
				{ dayIndex: 4, startTime: '', endTime: '' },
				{ dayIndex: 5, startTime: '', endTime: '' },
				{ dayIndex: 6, startTime: '', endTime: '' },
			];

			expect(isScheduleActive(schedule)).toBe(false);
		});
	});
});
