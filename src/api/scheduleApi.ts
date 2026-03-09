import { ScheduleCreateEventParams, ScheduleCreateEventResponse, ScheduleLookupOptions, ScheduleLookupResponse, ScheduleReviseParams, ScheduleShuffleParams } from '../core/common/types/schedule';
import TimeUtil from '../core/util/time';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	public createEvent(params: ScheduleCreateEventParams) {
		return this.apiRequest<ScheduleCreateEventResponse>('api/Schedule/Event', {
			method: 'POST',
			body: JSON.stringify({...params }),
		});
	}

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

	/**
	 * Shuffle the user's schedule.
	 * `POST /api/Schedule/Shuffle`
	 */
	public shuffle(params: ScheduleShuffleParams) {
		return this.apiRequest<ScheduleLookupResponse>('api/Schedule/Shuffle', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	}

	/**
	 * Revise (re-optimize) the user's schedule.
	 * `POST /api/Schedule/Revise`
	 */
	public revise(params: ScheduleReviseParams) {
		return this.apiRequest<ScheduleLookupResponse>('api/Schedule/Revise', {
			method: 'POST',
			body: JSON.stringify(params),
		});
	}
}
