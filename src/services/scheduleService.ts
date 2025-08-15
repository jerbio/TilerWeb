import { ScheduleApi } from '@/api/scheduleApi';
import { normalizeError } from '@/core/error';
import TimeUtil from '@/core/util/time';

class ScheduleService {
  private scheduleApi: ScheduleApi;
  constructor(scheduleApi: ScheduleApi) {
    this.scheduleApi = scheduleApi;
  }

  async getScheduleLookupById(
    scheduleId: string,
    options?: { startRange: number; endRange: number }
  ) {
    const startRange = options?.startRange ?? TimeUtil.now() - TimeUtil.inMilliseconds(3, 'd');
    const endRange = options?.endRange ?? TimeUtil.now() + TimeUtil.inMilliseconds(3, 'd');

    try {
      const schedule = await this.scheduleApi.getScheduleLookupById(scheduleId, {
        startRange,
        endRange,
      });
      return schedule.Content;
    } catch (error) {
      console.error('Error fetching schedule lookup by ID', error);
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
