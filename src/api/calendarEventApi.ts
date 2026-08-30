import {
	CalendarEventResponse,
	CalendarEventSearchParams,
	CalendarEventSearchResponse,
	CalendarEventUpdateParams,
	SubEventsOfCalendarResponse,
} from '../core/common/types/schedule';
import { PaginationParams } from '../core/common/types/api';
import { AppApi } from './appApi';
import { deviceTimeZone } from '@/core/common/utils/timeUtils';

export type CalendarEventQueryOptions = PaginationParams;

/** Sub-event ordering engine understood by the server. */
export type SubEventOrderingEngine = 'ProximityToNow' | 'Id' | 'ClusteredIndex';

/**
 * Options for the keyset-paged sub-events endpoint. Extends pagination with the ordering
 * engine and the two continuation cursors:
 * - `afterSubEventId`  → page immediately after that sub-event (scroll right / load more).
 * - `beforeSubEventId` → page immediately before that sub-event (scroll left / prepend).
 * Supply at most one cursor; omit both for the bootstrap (nearest-to-now) page.
 */
export interface SubEventsQueryOptions extends CalendarEventQueryOptions {
	orderingEngine?: SubEventOrderingEngine;
	afterSubEventId?: string;
	beforeSubEventId?: string;
}

export class CalendarEventApi extends AppApi {
	/** Build query-string params shared by both endpoints. */
	private buildParams(eventId: string, options?: SubEventsQueryOptions): string {
		const params: Record<string, string> = { EventID: eventId };

		if (options?.batchSize != null) {
			params['batchSize'] = String(options.batchSize);
		}
		if (options?.index != null) {
			params['index'] = String(options.index);
		}
		if (options?.order) {
			params['order'] = options.order;
		}
		if (options?.orderingEngine) {
			params['OrderingEngine'] = options.orderingEngine;
		}
		if (options?.afterSubEventId) {
			params['AfterSubEventId'] = options.afterSubEventId;
		}
		if (options?.beforeSubEventId) {
			params['BeforeSubEventId'] = options.beforeSubEventId;
		}
		params['mobileApp'] = 'true';

		return new URLSearchParams(params).toString();
	}

	/**
	 * Lookup a single CalendarEvent by ID (without sub-events).
	 * `GET /api/CalendarEvent?EventID=...`
	 */
	public getCalendarEvent(eventId: string, options?: CalendarEventQueryOptions) {
		const urlParams = this.buildParams(eventId, options);
		return this.apiRequest<CalendarEventResponse>(`api/CalendarEvent?${urlParams}`);
	}

	/**
	 * Lookup the sub-events of a CalendarEvent by its ID.
	 * `GET /api/CalendarEvent/SubEvents?EventID=...`
	 *
	 * Returns an array of ScheduleSubCalendarEvent.
	 */
	public getSubEventsOfCalendar(eventId: string, options?: SubEventsQueryOptions) {
		const urlParams = this.buildParams(eventId, options);
		return this.apiRequest<SubEventsOfCalendarResponse>(
			`api/CalendarEvent/SubEvents?${urlParams}`
		);
	}

	/**
	 * Search calendar events by name.
	 * `GET /api/CalendarEvent/Name?Data=...&UserName=...&UserID=...`
	 */
	public searchByName(params: CalendarEventSearchParams) {
		const urlEntries: Record<string, string> = {
			Data: params.data,
			UserName: params.userName,
			UserID: params.userId,
			MobileApp: 'true',
			Version: 'v2',
		};

		if (params.batchSize != null) {
			urlEntries['batchSize'] = String(params.batchSize);
		}
		if (params.index != null) {
			urlEntries['index'] = String(params.index);
		}

		const urlParams = new URLSearchParams(urlEntries).toString();

		return this.apiRequest<CalendarEventSearchResponse>(`api/CalendarEvent/Name?${urlParams}`);
	}

	/**
	 * Set a calendar event as the current ("now") event.
	 * `POST /api/CalendarEvent/Now`  body: `{ ID: eventId }`
	 */
	public setAsNow(eventId: string) {
		return this.apiRequest<CalendarEventResponse>('api/CalendarEvent/Now', {
			method: 'POST',
			body: JSON.stringify({
				ID: eventId,
				TimeZone: deviceTimeZone().toString(),
			}),
		});
	}

	/**
	 * Mark a calendar event as complete.
	 * `POST /api/CalendarEvent/Complete`  body: `{ EventID: eventId }`
	 */
	public markAsComplete(eventId: string) {
		return this.apiRequest<CalendarEventResponse>('api/CalendarEvent/Complete', {
			method: 'POST',
			body: JSON.stringify({
				EventID: eventId,
				TimeZone: deviceTimeZone().toString(),
			}),
		});
	}

	/**
	 * Delete a calendar event.
	 * `DELETE /api/CalendarEvent`  body: `{ EventID: eventId }`
	 */
	public deleteCalendarEvent(eventId: string) {
		return this.apiRequest<CalendarEventResponse>('api/CalendarEvent', {
			method: 'DELETE',
			body: JSON.stringify({
				EventID: eventId,
				TimeZone: deviceTimeZone().toString(),
			}),
		});
	}

	/**
	 * Update a calendar event.
	 * `POST /api/CalendarEvent/Update`
	 * Automatically enriches params with the device's current location.
	 */
	public async updateCalendarEvent(params: CalendarEventUpdateParams) {
		const loc = await this.getLocationData();
		const enriched: CalendarEventUpdateParams = {
			...params,
			UserLongitude: params.UserLongitude ?? loc.longitude?.toString() ?? '',
			UserLatitude: params.UserLatitude ?? loc.latitude?.toString() ?? '',
			UserLocationVerified: params.UserLocationVerified ?? (loc.verified ? 'true' : 'false'),
			TimeZone: params.TimeZone ?? deviceTimeZone().toString(),
		};
		return this.apiRequest<CalendarEventResponse>('api/CalendarEvent/Update', {
			method: 'POST',
			body: JSON.stringify(enriched),
		});
	}
}
