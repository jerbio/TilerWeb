import { NotesApi } from '@/api/notesApi';
import { normalizeError } from '@/core/error';
import { TilerResponseError } from '@/core/common/types/errors';
import { NotesPayload, NotesScope, NotesUpdateRequest } from '@/core/common/types/schedule';

/**
 * Thin wrapper around {@link NotesApi} that unwraps the standard
 * `{ Error, Content, ServerStatus }` envelope and normalizes errors.
 *
 * Concurrency conflicts are NOT thrown — they surface to the caller as
 * `payload.concurrencyConflict === true` so the UI can render a merge view.
 */
export class NotesService {
	private notesApi: NotesApi;

	constructor(notesApi: NotesApi) {
		this.notesApi = notesApi;
	}

	async getNotes(eventId: string, scope: NotesScope = 'auto'): Promise<NotesPayload> {
		try {
			const response = await this.notesApi.getNotes(eventId, scope);
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}
			return response.Content;
		} catch (error) {
			console.error('Error fetching notes', error);
			throw normalizeError(error);
		}
	}

	async updateNotes(request: NotesUpdateRequest): Promise<NotesPayload> {
		try {
			const response = await this.notesApi.updateNotes(request);
			if (response.Error.Code !== '0') {
				throw TilerResponseError.fromApiCodeResponse(response.Error);
			}
			return response.Content;
		} catch (error) {
			console.error('Error updating notes', error);
			throw normalizeError(error);
		}
	}
}
