import { vi } from 'vitest';
import { NotesService } from '../notesService';
import type { NotesApi } from '@/api/notesApi';
import type { NotesResponse } from '@/core/common/types/schedule';

const buildSuccess = (overrides: Partial<NotesResponse['Content']> = {}): NotesResponse => ({
	Error: { Code: '0', Message: 'SUCCESS' },
	Content: {
		EventId: 'evt_0_0_0',
		Scope: 'calendar',
		UserNote: 'hello',
		AgentNote: null,
		Source: 'user',
		AuthorUserId: 'u-1',
		AgentNoteUpdatedAt: null,
		Etag: 'AAAAAAAAB9I=',
		...overrides,
	},
	ServerStatus: null,
});

describe('NotesService', () => {
	describe('getNotes', () => {
		it('forwards eventId and scope to NotesApi and returns Content', async () => {
			const notesApiMock = {
				getNotes: vi.fn().mockResolvedValue(buildSuccess()),
				updateNotes: vi.fn(),
			} as unknown as NotesApi;

			const service = new NotesService(notesApiMock);
			const result = await service.getNotes('evt_0_0_0', 'calendar');

			expect(notesApiMock.getNotes).toHaveBeenCalledWith('evt_0_0_0', 'calendar');
			expect(result.UserNote).toBe('hello');
			expect(result.Etag).toBe('AAAAAAAAB9I=');
		});

		it('defaults to scope "auto" when not provided', async () => {
			const notesApiMock = {
				getNotes: vi.fn().mockResolvedValue(buildSuccess()),
				updateNotes: vi.fn(),
			} as unknown as NotesApi;

			await new NotesService(notesApiMock).getNotes('evt_0_0_0');

			expect(notesApiMock.getNotes).toHaveBeenCalledWith('evt_0_0_0', 'auto');
		});

		it('throws when API returns non-zero error code', async () => {
			const notesApiMock = {
				getNotes: vi.fn().mockResolvedValue({
					Error: { Code: '4', Message: 'NOT_FOUND' },
					Content: null as unknown as NotesResponse['Content'],
					ServerStatus: null,
				} satisfies NotesResponse),
				updateNotes: vi.fn(),
			} as unknown as NotesApi;

			await expect(new NotesService(notesApiMock).getNotes('missing')).rejects.toThrow();
		});
	});

	describe('updateNotes', () => {
		it('forwards request to NotesApi and returns Content', async () => {
			const notesApiMock = {
				getNotes: vi.fn(),
				updateNotes: vi
					.fn()
					.mockResolvedValue(buildSuccess({ UserNote: 'updated', Etag: 'next==' })),
			} as unknown as NotesApi;

			const service = new NotesService(notesApiMock);
			const result = await service.updateNotes({
				EventID: 'evt_0_0_0',
				Scope: 'calendar',
				UserNote: 'updated',
				Etag: 'AAAAAAAAB9I=',
			});

			expect(notesApiMock.updateNotes).toHaveBeenCalledWith({
				EventID: 'evt_0_0_0',
				Scope: 'calendar',
				UserNote: 'updated',
				Etag: 'AAAAAAAAB9I=',
			});
			expect(result.UserNote).toBe('updated');
			expect(result.Etag).toBe('next==');
		});

		it('returns the conflict payload without throwing when concurrencyConflict is set', async () => {
			const notesApiMock = {
				getNotes: vi.fn(),
				updateNotes: vi.fn().mockResolvedValue(buildSuccess({ concurrencyConflict: true })),
			} as unknown as NotesApi;

			const result = await new NotesService(notesApiMock).updateNotes({
				EventID: 'evt_0_0_0',
				UserNote: 'racey',
				Etag: 'stale==',
			});

			expect(result.concurrencyConflict).toBe(true);
		});

		it('propagates network errors', async () => {
			const notesApiMock = {
				getNotes: vi.fn(),
				updateNotes: vi.fn().mockRejectedValue(new Error('Network error')),
			} as unknown as NotesApi;

			await expect(
				new NotesService(notesApiMock).updateNotes({
					EventID: 'evt_0_0_0',
					UserNote: 'x',
					Etag: '',
				})
			).rejects.toThrow();
		});
	});
});
