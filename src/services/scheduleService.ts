import { ScheduleApi } from '@/api/scheduleApi';
import { SubCalendarEventApi } from '@/api/subCalendarEventApi';
import { CalendarEventApi } from '@/api/calendarEventApi';
import { LocationApi } from '@/api/locationApi';
import { CalendarEventQueryOptions } from '@/api/calendarEventApi';
import {
	ScheduleCreateEventParams,
	ScheduleLookupOptions,
	ScheduleProcrastinateAllParams,
	ScheduleProcrastinateEventParams,
	ScheduleReviseParams,
	ScheduleShuffleParams,
	CalendarEventUpdateParams,
} from '@/core/common/types/schedule';
import { normalizeError } from '@/core/error';
import TimeUtil from '@/core/util/time';

const defaultScheduleOptions: ScheduleLookupOptions = {
	startRange: TimeUtil.now() - TimeUtil.inMilliseconds(3, 'd'),
	endRange: TimeUtil.now() + TimeUtil.inMilliseconds(3, 'd'),
};

class ScheduleService {
	private scheduleApi: ScheduleApi;
	private subCalendarEventApi: SubCalendarEventApi;
	private calendarEventApi: CalendarEventApi;
	private locationApi: LocationApi;

	constructor(
		scheduleApi: ScheduleApi,
		subCalendarEventApi: SubCalendarEventApi,
		calendarEventApi: CalendarEventApi,
		locationApi: LocationApi
	) {
		this.scheduleApi = scheduleApi;
		this.subCalendarEventApi = subCalendarEventApi;
		this.calendarEventApi = calendarEventApi;
		this.locationApi = locationApi;
	}

	async createEvent(params: ScheduleCreateEventParams) {
		try {
			const res = await this.scheduleApi.createEvent(params);
			return res.Content;
		} catch (error) {
			console.error('Error creating sub-calendar event', error);
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
	 * Lookup a single CalendarEvent by ID (without sub-events).
	 * Supports standard pagination via `batchSize`, `index`, and `order`.
	 */
	async lookupCalendarEventById(eventId: string, options?: CalendarEventQueryOptions) {
		try {
			const response = await this.calendarEventApi.getCalendarEvent(eventId, options);
			return response.Content;
		} catch (error) {
			console.error('Error fetching CalendarEvent by ID', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Lookup the sub-events of a CalendarEvent by its parent ID.
	 * `GET /api/CalendarEvent/SubEvents?EventID=...`
	 * Returns an array of ScheduleSubCalendarEvent.
	 */
	async getSubEventsOfCalendar(eventId: string, options?: CalendarEventQueryOptions) {
		try {
			const response = await this.calendarEventApi.getSubEventsOfCalendar(eventId, options);
			return response.Content;
		} catch (error) {
			console.error('Error fetching sub-events of CalendarEvent by ID', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Update a SubCalendarEvent's start and/or end time.
	 * Returns the updated SubCalendarEvent payload.
	 */
	async updateSubCalendarEvent(
		eventId: string,
		updates: {
			name?: string;
			start?: number;
			end?: number;
			calendarEnd?: number;
			thirdPartyEventId?: string;
			thirdPartyUserId?: string;
			calendarType?: string;
		}
	) {
		try {
			const response = await this.subCalendarEventApi.updateSubCalendarEvent({
				Id: eventId,
				CalendarEventName: updates.name,
				SubCalendarEventStart: updates.start,
				SubCalendarEventEnd: updates.end,
				CalendarEventEnd: updates.calendarEnd,
				TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				ThirdPartyEventID: updates.thirdPartyEventId,
				ThirdPartyUserID: updates.thirdPartyUserId,
				CalendarType: updates.calendarType,
			});
			return response.Content;
		} catch (error) {
			console.error('Error updating SubCalendarEvent', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Search calendar events by name.
	 * `GET /api/CalendarEvent/Name?Data=...&UserName=...&UserID=...`
	 * Returns an array of CalendarEvent matching the search query.
	 */
	async searchCalendarEventsByName(
		query: string,
		userName: string,
		userId: string,
		pagination?: { batchSize?: number; index?: number }
	) {
		try {
			const response = await this.calendarEventApi.searchByName({
				data: query,
				userName,
				userId,
				...pagination,
			});

			return response.Content;
		} catch (error) {
			console.error('Error searching calendar events by name', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Set a calendar event as the current ("now") event.
	 * `POST /api/CalendarEvent/Now`
	 */
	async setCalendarEventAsNow(eventId: string) {
		try {
			const response = await this.calendarEventApi.setAsNow(eventId);
			return response.Content;
		} catch (error) {
			console.error('Error setting calendar event as now', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Mark a calendar event as complete.
	 * `POST /api/CalendarEvent/Complete`
	 */
	async markCalendarEventComplete(eventId: string) {
		try {
			const response = await this.calendarEventApi.markAsComplete(eventId);
			return response.Content;
		} catch (error) {
			console.error('Error marking calendar event as complete', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Delete a calendar event.
	 * `DELETE /api/CalendarEvent`
	 */
	async deleteCalendarEvent(eventId: string) {
		try {
			const response = await this.calendarEventApi.deleteCalendarEvent(eventId);
			return response.Content;
		} catch (error) {
			console.error('Error deleting calendar event', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Delete a schedule event (third-party aware).
	 * `DELETE /api/Schedule/Event`
	 */
	async deleteScheduleEvent(
		eventId: string,
		thirdPartyType: string,
		thirdPartyEventId: string,
		thirdPartyUserId: string
	) {
		try {
			const response = await this.scheduleApi.deleteEvent({
				EventID: eventId,
				ThirdPartyType: thirdPartyType,
				ThirdPartyEventID: thirdPartyEventId,
				ThirdPartyUserID: thirdPartyUserId,
			});
			return response.Content;
		} catch (error) {
			console.error('Error deleting schedule event', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Update a calendar event.
	 * `POST /api/CalendarEvent/Update`
	 */
	async updateCalendarEvent(params: CalendarEventUpdateParams) {
		try {
			const response = await this.calendarEventApi.updateCalendarEvent(params);
			return response.Content;
		} catch (error) {
			console.error('Error updating calendar event', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Shuffle the user's schedule.
	 * Calls `POST /api/Schedule/Shuffle` and returns the updated schedule.
	 */
	async shuffleSchedule(params: ScheduleShuffleParams) {
		try {
			const response = await this.scheduleApi.shuffle(params);
			return response.Content;
		} catch (error) {
			console.error('Error shuffling schedule', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Revise (re-optimize) the user's schedule.
	 * Calls `POST /api/Schedule/Revise` and returns the updated schedule.
	 */
	async reviseSchedule(params: ScheduleReviseParams) {
		try {
			const response = await this.scheduleApi.revise(params);
			return response.Content;
		} catch (error) {
			console.error('Error revising schedule', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Mark a single event as complete via Schedule API.
	 * `POST /api/Schedule/Event/Complete`
	 */
	async completeScheduleEvent(eventId: string) {
		try {
			const response = await this.scheduleApi.completeEvent(eventId);
			return response.Content;
		} catch (error) {
			console.error('Error completing schedule event', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Set a single event as the current ("now") event via Schedule API.
	 * `POST /api/Schedule/Event/Now`
	 */
	async setScheduleEventAsNow(eventId: string) {
		try {
			const response = await this.scheduleApi.setEventAsNow(eventId);
			return response.Content;
		} catch (error) {
			console.error('Error setting schedule event as now', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Procrastinate (defer) a single event via Schedule API.
	 * `POST /api/Schedule/Event/Procrastinate`
	 */
	async procrastinateScheduleEvent(params: ScheduleProcrastinateEventParams) {
		try {
			const response = await this.scheduleApi.procrastinateEvent(params);
			return response.Content;
		} catch (error) {
			console.error('Error procrastinating schedule event', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Procrastinate (defer) all events in the user's schedule.
	 * Calls `POST /api/Schedule/ProcrastinateAll` and returns the updated schedule.
	 */
	async procrastinateAllSchedule(params: ScheduleProcrastinateAllParams) {
		try {
			const response = await this.scheduleApi.procrastinateAll(params);
			return response.Content;
		} catch (error) {
			console.error('Error procrastinating all schedule events', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Search locations by name, including Google Maps results.
	 */
	async searchLocations(query: string) {
		try {
			const response = await this.locationApi.searchByName(query);
			return response.Content;
		} catch (error) {
			console.error('Error searching locations', error);
			throw normalizeError(error);
		}
	}

	/**
	 * Fetch a location by its ID.
	 * `GET /api/Location?id=...&IdSearch.mobileApp=true`
	 */
	async lookupLocationById(locationId: string) {
		try {
			const response = await this.locationApi.getLocation(locationId);
			return response.Content;
		} catch (error) {
			console.error('Error fetching location by ID', error);
			throw normalizeError(error);
		}
	}
}

export default ScheduleService;
