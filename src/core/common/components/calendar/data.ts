import { RGBColor } from '@/core/util/colors';
import { InitialCreateTileFormState } from './create_tile';
import dayjs from 'dayjs';
import {
  ScheduleRepeatEndType,
  ScheduleRepeatFrequency,
  ScheduleRepeatStartType,
  ScheduleRepeatType,
  ScheduleRepeatWeekday,
} from '../../types/schedule';
import { eventColors } from '@/core/constants/calendar_options';

export enum CreateTileRestrictionType {
  Anytime = '0',
  WorkHours = '1',
  PersonalHours = '2',
  Custom = '3',
}

export const initialCreateTileFormState: InitialCreateTileFormState = {
	start: dayjs(),
	action: '',
	location: '',
	locationId: null,
	locationSource: '',
	locationIsVerified: false,
	locationTag: '',
  hasLocationNickname: false,
	locationNickname: '',
	durationHours: 0,
	durationMins: 0,
	deadline: dayjs(),
	color: new RGBColor(eventColors[0]),
	isRecurring: false,
	recurrenceType: ScheduleRepeatType.Daily,
	recurrenceFrequency: ScheduleRepeatFrequency.Daily,
	recurrenceWeeklyDays: [ScheduleRepeatWeekday.Sunday],
	recurrenceStartType: ScheduleRepeatStartType.Default,
	recurrenceStartDate: dayjs(),
	recurrenceEndType: ScheduleRepeatEndType.Never,
	recurrenceEndDate: dayjs().add(1, 'week'),
  isTimeRestricted: false,
	timeRestrictionType: CreateTileRestrictionType.Custom,
  customTimeRestrictionSchedule: Array.from({ length: 7 }, (_, i) => ({
    dayIndex: i,
    startTime: '',
    endTime: '',
  })),
	timeRestrictionStart: '00:00',
	timeRestrictionEnd: '23:59',
};
