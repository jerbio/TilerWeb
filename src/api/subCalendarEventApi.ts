import { SubCalendarEventLookupResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';

export type UpdateSubCalendarEventPayload = {
	id: string;
	start?: number;
	end?: number;
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
	 * `POST /api/SubCalendarEvent/Update`
	 */
	public updateSubCalendarEvent(payload: UpdateSubCalendarEventPayload) {
		return this.apiRequest<SubCalendarEventLookupResponse>(
			'api/SubCalendarEvent/Update',
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		);
	}
}
