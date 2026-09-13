import { deviceTimeZone } from '@/core/common/utils/timeUtils';
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
	/**
	 * RSVP response update for third-party events. Sent only when the user
	 * accepts or declines an invite. (Widen to include `'Tentative'` if that
	 * action is exposed later.)
	 */
	RsvpStatusUpdate?: 'Accepted' | 'Declined';
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
	 * Automatically enriches the payload with the device's current location.
	 */
	public async updateSubCalendarEvent(payload: UpdateSubCalendarEventPayload) {
		const loc = await this.getLocationData();
		const enrichedPayload: UpdateSubCalendarEventPayload = {
			...payload,
			Longitude: payload.Longitude ?? loc.longitude,
			Latitude: payload.Latitude ?? loc.latitude,
			LocationVerified: payload.LocationVerified ?? loc.verified,
			TimeZone: payload.TimeZone ?? deviceTimeZone().toString(),
		};
		return this.apiRequest<SubCalendarEventLookupResponse>('api/SubCalendarEvent', {
			method: 'POST',
			body: JSON.stringify(enrichedPayload),
		});
	}
}
