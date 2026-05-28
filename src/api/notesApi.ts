import { NotesResponse, NotesScope, NotesUpdateRequest } from '../core/common/types/schedule';
import { AppApi } from './appApi';

/**
 * Client for the `/api/CalendarEvent/Notes` read/write endpoints.
 *
 * The server endpoint resolves either the parent calendar event MiscData blob
 * or the sub-event MiscData blob based on the supplied `Scope`:
 *
 *  - `auto`     — sub-event blob if it has any content, else calendar blob (default).
 *  - `calendar` — always the parent calendar event blob.
 *  - `subevent` — always the sub-event blob (404-equivalent if missing).
 */
export class NotesApi extends AppApi {
	/** GET /api/CalendarEvent/Notes?EventID=...&Scope=... */
	public getNotes(eventId: string, scope: NotesScope = 'auto') {
		const params = new URLSearchParams({ EventID: eventId, Scope: scope });
		return this.apiRequest<NotesResponse>(`api/CalendarEvent/Notes?${params.toString()}`);
	}

	/**
	 * PUT /api/CalendarEvent/Notes — overwrite the UserNote on the targeted blob.
	 *
	 * `Etag` should be the value last seen on `getNotes`. Pass `''` for the
	 * first write. On etag mismatch the server returns 200 with
	 * `Content.concurrencyConflict === true` and the current server payload, so
	 * the caller can surface a merge UI.
	 */
	public updateNotes(request: NotesUpdateRequest) {
		const body = {
			EventID: request.EventID,
			Scope: request.Scope ?? 'auto',
			UserNote: request.UserNote,
			Etag: request.Etag,
		};
		return this.apiRequest<NotesResponse>('api/CalendarEvent/Notes', {
			method: 'PUT',
			body: JSON.stringify(body),
		});
	}
}
