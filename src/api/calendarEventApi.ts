import { CalendarEventResponse } from '../core/common/types/schedule';
import { AppApi } from './appApi';

export class CalendarEventApi extends AppApi {
	/**
	 * Lookup a single CalendarEvent (with its child subEvents) by ID.
	 * `GET /api/CalendarEvent?EventID=...`
	 */
	public getCalendarEvent(eventId: string) {
		const urlParams = new URLSearchParams({ EventID: eventId }).toString();
		return this.apiRequest<CalendarEventResponse>(`api/CalendarEvent?${urlParams}`);
	}
}
