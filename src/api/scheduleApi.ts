import { ScheduleLookupResponse } from '../core/common/types/schedule';
import TimeUtil from '../core/util/time';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	public getScheduleLookupById(
		scheduleId: string,
		options: { startRange: number; endRange: number }
	) {
		const urlParams = new URLSearchParams({
			scheduleId: scheduleId,
			mobileApp: true.toString(),
			startRange: options.startRange.toString(),
			endRange: options.endRange.toString(),
		}).toString();

		return this.apiRequest<ScheduleLookupResponse>(`api/Schedule/Lookup?${urlParams}`);
	}

	public getSchedule() {
		const start = TimeUtil.now();
		const end = start + TimeUtil.inMilliseconds(1, 'w');
		const urlParams = new URLSearchParams({
			StartRange: start.toString(),
			EndRange: end.toString(),
			Version: 'v2',
			MobileApp: true.toString(),
		}).toString();

		return this.apiRequest<ScheduleLookupResponse>(`api/Schedule?${urlParams}`, {
			authRequired: true,
		});
	}
}
