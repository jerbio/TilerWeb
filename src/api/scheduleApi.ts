import {
	ScheduleLookupOptions,
	ScheduleLookupResponse,
} from '../core/common/types/schedule';
import TimeUtil from '../core/util/time';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	private lookupSchedule(
		params: Record<string, string>,
	) {
		const urlParams = new URLSearchParams({
			mobileApp: true.toString(),
			...params,
		}).toString();

		return this.apiRequest<ScheduleLookupResponse>(`api/Schedule/Lookup?${urlParams}`);
	}

	public lookupScheduleById(
		scheduleId: string,
		options: ScheduleLookupOptions,
	) {
		return this.lookupSchedule({
			scheduleId,
			startRange: options.startRange.toString(),
			endRange: options.endRange.toString(),
		});
	}

	public lookupScheduleByUserId(
		userId: string,
		options: ScheduleLookupOptions,
	) {
		return this.lookupSchedule({
			lookupUserId: userId,
			startRange: options.startRange.toString(),
			endRange: options.endRange.toString(),
		});
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

		return this.apiRequest<ScheduleLookupResponse>(`api/Schedule?${urlParams}`);
	}
}
