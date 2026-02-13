import { ScheduleApi } from '@/api/scheduleApi';
import { ScheduleCreateEventParams, ScheduleLookupOptions } from '@/core/common/types/schedule';
import { normalizeError } from '@/core/error';
import TimeUtil from '@/core/util/time';

const defaultScheduleOptions: ScheduleLookupOptions = {
	startRange: TimeUtil.now() - TimeUtil.inMilliseconds(3, 'd'),
	endRange: TimeUtil.now() + TimeUtil.inMilliseconds(3, 'd'),
}

class ScheduleService {
  private scheduleApi: ScheduleApi;
  constructor(scheduleApi: ScheduleApi) {
    this.scheduleApi = scheduleApi;
  }

	async createEvent(params: ScheduleCreateEventParams) {
		try {
			const res = await this.scheduleApi.createEvent(params);
			return res.Content;
		} catch (error) {
			console.error("Error creating sub-calendar event", error);
			throw normalizeError(error);
		}
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
}

export default ScheduleService;
