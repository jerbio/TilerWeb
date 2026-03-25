import { SubCalendarEventLookupResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';

export type UpdateSubCalendarEventPayload = {
	Id: string;
	CalendarEventName?: string;
	Split?: number;
	SubCalendarEventStart?: number;
	SubCalendarEventEnd?: number;
	CalendarEventStart?: number;
	CalendarEventEnd?: number;
	CalendarType?: string;
	Longitude?: number;
	Latitude?: number;
	LocationVerified?: boolean;
	TimeZone: string;
	ThirdPartyEventID?: string;
	ThirdPartyUserID?: string;
};

export class SubCalendarEventApi extends AppApi {
	/**
	 * Lookup a single SubCalendarEvent by ID.
	 * `GET /api/SubCalendarEvent?EventID=...`
	 */
	public getSubCalendarEvent(eventId: string) {
		const urlParams = new URLSearchParams({ EventID: eventId }).toString();
		return this.apiRequest<SubCalendarEventLookupResponse>(`api/SubCalendarEvent?${urlParams}`);
	}

	/**
	 * Update a SubCalendarEvent's start and/or end time.
	 * `POST /api/SubCalendarEvent`
	 */
	public updateSubCalendarEvent(payload: UpdateSubCalendarEventPayload) {
		return this.apiRequest<SubCalendarEventLookupResponse>('api/SubCalendarEvent', {
			method: 'POST',
			body: JSON.stringify(payload),
		});
	}
}
