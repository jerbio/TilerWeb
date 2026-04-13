import {
	ScheduleCreateEventParams,
	ScheduleCreateEventResponse,
	ScheduleDeleteEventParams,
	ScheduleLookupOptions,
	ScheduleLookupResponse,
	ScheduleProcrastinateAllParams,
	ScheduleProcrastinateEventParams,
	ScheduleReviseParams,
	ScheduleShuffleParams,
} from '../core/common/types/schedule';
import TimeUtil from '../core/util/time';
import { AppApi } from './appApi';

export class ScheduleApi extends AppApi {
	/**
	 * Wraps every schedule-mutating request with automatic user-location injection.
	 * Spreads location fields after caller params so they always reflect the
	 * device's current position, and defaults Version to 'v2'.
	 */
	private async scheduleRequest<T>(method: string, endpoint: string, params: object): Promise<T> {
		const loc = await this.getLocationData();
		const enriched = {
			Version: 'v2',
			...params,
			UserLongitude: loc.longitude?.toString() ?? '',
			UserLatitude: loc.latitude?.toString() ?? '',
			UserLocationVerified: loc.verified ? 'true' : 'false',
		};
		return this.apiRequest<T>(endpoint, {
			method,
			body: JSON.stringify(enriched),
		});
	}

	private schedulePost<T>(endpoint: string, params: object): Promise<T> {
		return this.scheduleRequest<T>('POST', endpoint, params);
	}

	public createEvent(params: ScheduleCreateEventParams) {
		return this.schedulePost<ScheduleCreateEventResponse>('api/Schedule/Event', params);
	}

	private lookupSchedule(params: Record<string, string>) {
		const urlParams = new URLSearchParams({
			mobileApp: true.toString(),
			...params,
		}).toString();

		return this.apiRequest<ScheduleLookupResponse>(`api/Schedule/Lookup?${urlParams}`);
	}

	public lookupScheduleById(scheduleId: string, options: ScheduleLookupOptions) {
		return this.lookupSchedule({
			scheduleId,
			startRange: options.startRange.toString(),
			endRange: options.endRange.toString(),
		});
	}

	public lookupScheduleByUserId(userId: string, options: ScheduleLookupOptions) {
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
		return this.schedulePost<ScheduleLookupResponse>('api/Schedule/Shuffle', params);
	}

	/**
	 * Revise (re-optimize) the user's schedule.
	 * `POST /api/Schedule/Revise`
	 */
	public revise(params: ScheduleReviseParams) {
		return this.schedulePost<ScheduleLookupResponse>('api/Schedule/Revise', params);
	}

	/**
	 * Mark a single event as complete.
	 * `POST /api/Schedule/Event/Complete`
	 */
	public completeEvent(eventId: string) {
		return this.schedulePost<ScheduleLookupResponse>('api/Schedule/Event/Complete', {
			EventID: eventId,
		});
	}

	/**
	 * Set a single event as the current ("now") event.
	 * `POST /api/Schedule/Event/Now`
	 */
	public setEventAsNow(eventId: string) {
		return this.schedulePost<ScheduleLookupResponse>('api/Schedule/Event/Now', {
			EventID: eventId,
		});
	}

	/**
	 * Procrastinate (defer) a single event.
	 * `POST /api/Schedule/Event/Procrastinate`
	 */
	public procrastinateEvent(params: ScheduleProcrastinateEventParams) {
		return this.schedulePost<ScheduleLookupResponse>(
			'api/Schedule/Event/Procrastinate',
			params
		);
	}

	/**
	 * Procrastinate (defer) all events in the user's schedule.
	 * `POST /api/Schedule/ProcrastinateAll`
	 */
	public procrastinateAll(params: ScheduleProcrastinateAllParams) {
		return this.schedulePost<ScheduleLookupResponse>('api/Schedule/ProcrastinateAll', params);
	}

	/**
	 * Delete a schedule event.
	 * `DELETE /api/Schedule/Event`
	 */
	public deleteEvent(params: ScheduleDeleteEventParams) {
		return this.scheduleRequest<ScheduleLookupResponse>('DELETE', 'api/Schedule/Event', params);
	}
}
