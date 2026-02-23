import { SubCalendarEventLookupResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';

export class SubCalendarEventApi extends AppApi {
	/**
	 * Lookup a single SubCalendarEvent by ID.
	 * `GET /api/SubCalendarEvent?EventID=...`
	 */
	public getSubCalendarEvent(eventId: string) {
		const urlParams = new URLSearchParams({ EventID: eventId }).toString();
		return this.apiRequest<SubCalendarEventLookupResponse>(`api/SubCalendarEvent?${urlParams}`);
	}
}
