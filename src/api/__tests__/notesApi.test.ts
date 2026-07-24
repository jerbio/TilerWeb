import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesApi } from '../notesApi';
import type { NotesResponse } from '@/core/common/types/schedule';

vi.mock('@/config/config_getter', () => ({
	Env: {
		get: () => 'https://test.example.com/',
	},
}));

const fetchSpy = vi.spyOn(globalThis, 'fetch');

const successResponse: NotesResponse = {
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: {
		EventId: 'evt-123_0_0_0',
		Scope: 'calendar',
		UserNote: 'pick up bread',
		AgentNote: null,
		Source: 'user',
		AuthorUserId: 'user-1',
		AgentNoteUpdatedAt: null,
		Etag: 'AAAAAAAAB9I=',
	},
	ServerStatus: null,
};

const okResponseBody = () =>
	new Response(JSON.stringify(successResponse), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});

describe('NotesApi', () => {
	let api: NotesApi;

	beforeEach(() => {
		api = new NotesApi();
		fetchSpy.mockReset();
	});

	describe('getNotes', () => {
		it('sends GET to /api/CalendarEvent/Notes with EventID + scope query params', async () => {
			fetchSpy.mockResolvedValueOnce(okResponseBody());

			await api.getNotes('evt-123_0_0_0', 'calendar');

			expect(fetchSpy).toHaveBeenCalledOnce();
			const [urlArg, init] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;

			expect(urlStr).toContain('api/CalendarEvent/Notes');
			expect(urlStr).toContain('EventID=evt-123_0_0_0');
			expect(urlStr).toContain('Scope=calendar');
			expect(init?.method ?? 'GET').toBe('GET');
		});

		it('defaults scope to "auto" when omitted', async () => {
			fetchSpy.mockResolvedValueOnce(okResponseBody());

			await api.getNotes('evt-123_0_0_0');

			const [urlArg] = fetchSpy.mock.calls[0];
			const urlStr = typeof urlArg === 'string' ? urlArg : (urlArg as Request).url;
			expect(urlStr).toContain('Scope=auto');
		});

		it('returns the parsed payload on success', async () => {
			fetchSpy.mockResolvedValueOnce(okResponseBody());

			const res = await api.getNotes('evt-123_0_0_0');
			expect(res.Content.UserNote).toBe('pick up bread');
			expect(res.Content.Etag).toBe('AAAAAAAAB9I=');
		});
	});

	describe('updateNotes', () => {
		it('sends PUT with JSON body containing EventID, UserNote, Etag, Scope', async () => {
			fetchSpy.mockResolvedValueOnce(okResponseBody());

			await api.updateNotes({
				EventID: 'evt-123_0_0_0',
				Scope: 'calendar',
				UserNote: 'updated',
				Etag: 'AAAAAAAAB9I=',
			});

			expect(fetchSpy).toHaveBeenCalledOnce();
			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);

			expect(request.url).toContain('api/CalendarEvent/Notes');
			expect(request.method).toBe('PUT');
			const body = await request.json();
			expect(body).toEqual({
				EventID: 'evt-123_0_0_0',
				Scope: 'calendar',
				UserNote: 'updated',
				Etag: 'AAAAAAAAB9I=',
			});
		});

		it('passes an empty Etag through unchanged (first write)', async () => {
			fetchSpy.mockResolvedValueOnce(okResponseBody());

			await api.updateNotes({
				EventID: 'evt-123_0_0_0',
				UserNote: 'first note',
				Etag: '',
			});

			const callArgs = fetchSpy.mock.calls[0];
			const request =
				callArgs[0] instanceof Request
					? callArgs[0]
					: new Request(callArgs[0] as string, callArgs[1] as RequestInit);
			const body = await request.json();
			expect(body.Etag).toBe('');
			// Scope should default to 'auto' when caller omits it.
			expect(body.Scope).toBe('auto');
		});

		it('surfaces concurrencyConflict flag from server response', async () => {
			const conflictBody: NotesResponse = {
				...successResponse,
				Content: { ...successResponse.Content, concurrencyConflict: true },
			};
			fetchSpy.mockResolvedValueOnce(
				new Response(JSON.stringify(conflictBody), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				})
			);

			const res = await api.updateNotes({
				EventID: 'evt-123_0_0_0',
				UserNote: 'racey',
				Etag: 'stale==',
			});

			expect(res.Content.concurrencyConflict).toBe(true);
		});
	});
});
