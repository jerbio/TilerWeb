import { NotesApi } from './notesApi';
import { NotesResponse, NotesUpdateRequest } from '@/core/common/types/schedule';

/** Shared notes contract. Id identifies the selected target; Etag is an opaque concurrency token. */
export class TileShareNotesApi extends NotesApi {
	constructor(private readonly target: 'tilette' | 'cluster' = 'tilette') {
		super();
	}
	private get notesRoute() {
		return this.target === 'cluster'
			? 'api/TileShareCluster/Notes'
			: 'api/TileshareTemplate/Notes';
	}
	async getNotes(id: string): Promise<NotesResponse> {
		const query = new URLSearchParams({ Id: id });
		return this.requestNotes(`${this.notesRoute}?${query}`);
	}
	async updateNotes(request: NotesUpdateRequest): Promise<NotesResponse> {
		return this.requestNotes(this.notesRoute, {
			method: 'PUT',
			body: JSON.stringify({
				Id: request.EventID,
				UserNote: request.UserNote,
				Etag: request.Etag,
			}),
		});
	}
	private async requestNotes(
		route: string,
		options?: Pick<RequestInit, 'method' | 'body'>
	): Promise<NotesResponse> {
		const response = await this.apiRequest<NotesResponse>(route, {
			...options,
			cache: 'no-store',
		});
		if (response.Error && String(response.Error.Code) !== '0') return response;
		const data = response.Content as unknown as Record<string, unknown>;
		const etag = data?.Etag ?? data?.etag;
		if (!data || typeof etag !== 'string')
			throw new Error('Invalid notes response: missing Etag.');
		const text = (upper: string, lower: string) => {
			const value = data[upper] ?? data[lower];
			return typeof value === 'string' ? value : null;
		};
		return {
			...response,
			Error: { Code: '0', Message: '' },
			Content: {
				EventId: text('Id', 'id') ?? '',
				Scope: this.target,
				UserNote: text('UserNote', 'userNote'),
				AgentNote: text('AgentNote', 'agentNote'),
				Source: text('Source', 'source'),
				AuthorUserId: text('AuthorUserId', 'authorUserId'),
				AgentNoteUpdatedAt: text('AgentNoteUpdatedAt', 'agentNoteUpdatedAt'),
				Etag: etag,
				concurrencyConflict: data.concurrencyConflict === true,
				truncated: data.truncated === true,
			},
		};
	}
}
