import { RGB, RGBColor } from '@/core/util/colors';
import { InitialCreateTileFormState } from './create_tile';
import dayjs from 'dayjs';
import { ScheduleRepeatEndType, ScheduleRepeatFrequency, ScheduleRepeatStartType, ScheduleRepeatType, ScheduleRepeatWeekday } from '../../types/schedule';

export const eventColorOptions: Array<RGB> = [
  { r: 255, g: 159, b: 28 },
  { r: 0, g: 188, b: 212 },
  { r: 204, g: 51, b: 0 },
  { r: 102, g: 122, b: 62 },
  { r: 33, g: 150, b: 243 },
  { r: 126, g: 87, b: 194 },
  { r: 152, g: 255, b: 197 },
  { r: 219, g: 58, b: 94 },
];

export const initialCreateTileFormState: InitialCreateTileFormState = {
  start: dayjs(),
  action: '',
  location: '',
  durationHours: 0,
  durationMins: 0,
  deadline: dayjs(),
  color: new RGBColor(eventColorOptions[0]),
  isRecurring: false,
  recurrenceType: ScheduleRepeatType.Daily,
  recurrenceFrequency: ScheduleRepeatFrequency.Daily,
  recurrenceWeeklyDays: [ScheduleRepeatWeekday.Sunday],
  recurrenceStartType: ScheduleRepeatStartType.Default,
  recurrenceStartDate: dayjs(),
  recurrenceEndType: ScheduleRepeatEndType.Never,
  recurrenceEndDate: dayjs().add(1, 'week'),
  timeRestrictionType: null,
  isTimeRestricted: false,
  timeRestrictionStart: '00:00',
  timeRestrictionEnd: '23:59',
  hasLocationNickname: false,
  locationNickname: '',
};
