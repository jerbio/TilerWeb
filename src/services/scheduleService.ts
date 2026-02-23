import { ScheduleApi } from '@/api/scheduleApi';
import { SubCalendarEventApi } from '@/api/subCalendarEventApi';
import { CalendarEventApi } from '@/api/calendarEventApi';
import { ScheduleLookupOptions } from '@/core/common/types/schedule';
import { normalizeError } from '@/core/error';
import TimeUtil from '@/core/util/time';

const defaultScheduleOptions: ScheduleLookupOptions = {
	startRange: TimeUtil.now() - TimeUtil.inMilliseconds(3, 'd'),
	endRange: TimeUtil.now() + TimeUtil.inMilliseconds(3, 'd'),
}

class ScheduleService {
  private scheduleApi: ScheduleApi;
  private subCalendarEventApi: SubCalendarEventApi;
  private calendarEventApi: CalendarEventApi;

  constructor(
    scheduleApi: ScheduleApi,
    subCalendarEventApi: SubCalendarEventApi,
    calendarEventApi: CalendarEventApi,
  ) {
    this.scheduleApi = scheduleApi;
    this.subCalendarEventApi = subCalendarEventApi;
    this.calendarEventApi = calendarEventApi;
  }

  async lookupScheduleById(
    scheduleId: string,
    options: ScheduleLookupOptions = defaultScheduleOptions
  ) {
    try {
      const schedule = await this.scheduleApi.lookupScheduleById(scheduleId, options);
      return schedule.Content;
    } catch (error) {
      console.error('Error fetching schedule lookup by schedule ID', error);
      throw normalizeError(error);
    }
  }

  async lookupScheduleByUserId(
    userId: string,
    options: ScheduleLookupOptions = defaultScheduleOptions
  ) {
    try {
      const schedule = await this.scheduleApi.lookupScheduleByUserId(userId, options);
      return schedule.Content;
    } catch (error) {
      console.error('Error fetching schedule lookup by user ID', error);
      throw normalizeError(error);
    }
  }

  async getSchedule() {
    try {
      const schedule = await this.scheduleApi.getSchedule();
      return schedule.Content;
    } catch (error) {
      console.error('Error fetching schedule', error);
      throw normalizeError(error);
    }
  }

  /**
   * Lookup a single SubCalendarEvent by its ID.
   * Returns the raw SubCalendarEvent payload (unwrapped from ApiResponse).
   */
  async lookupSubCalendarEventById(eventId: string) {
    try {
      const response = await this.subCalendarEventApi.getSubCalendarEvent(eventId);
      return response.Content;
    } catch (error) {
      console.error('Error fetching SubCalendarEvent by ID', error);
      throw normalizeError(error);
    }
  }

  /**
   * Lookup a single CalendarEvent (with its child subEvents) by ID.
   * Returns the raw CalendarEvent payload (unwrapped from ApiResponse).
   */
  async lookupCalendarEventById(eventId: string) {
    try {
      const response = await this.calendarEventApi.getCalendarEvent(eventId);
      return response.Content;
    } catch (error) {
      console.error('Error fetching CalendarEvent by ID', error);
      throw normalizeError(error);
    }
  }
}

export default ScheduleService;
