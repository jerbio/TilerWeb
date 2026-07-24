import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useTileNotes } from '../useTileNotes';
import type { NotesPayload } from '@/core/common/types/schedule';

vi.mock('@/services', () => ({
	notesService: {
		getNotes: vi.fn(),
		updateNotes: vi.fn(),
	},
}));

import { notesService } from '@/services';

const basePayload = (overrides: Partial<NotesPayload> = {}): NotesPayload => ({
	EventId: 'evt_0_0_0',
	Scope: 'calendar',
	UserNote: 'hello',
	AgentNote: null,
	Source: 'user',
	AuthorUserId: 'u-1',
	AgentNoteUpdatedAt: null,
	Etag: 'AAAAAAAAB9I=',
	...overrides,
});

describe('useTileNotes', () => {
	beforeEach(() => {
		vi.mocked(notesService.getNotes).mockReset();
		vi.mocked(notesService.updateNotes).mockReset();
	});

	it('starts in a loading state when eventId is provided', async () => {
		vi.mocked(notesService.getNotes).mockResolvedValue(basePayload());

		const { result } = renderHook(() => useTileNotes('evt_0_0_0'));

		expect(result.current.isLoading).toBe(true);
		expect(result.current.payload).toBeNull();

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.payload?.UserNote).toBe('hello');
		expect(notesService.getNotes).toHaveBeenCalledWith('evt_0_0_0', 'auto');
	});

	it('does not load when eventId is null', () => {
		const { result } = renderHook(() => useTileNotes(null));

		expect(result.current.isLoading).toBe(false);
		expect(result.current.payload).toBeNull();
		expect(notesService.getNotes).not.toHaveBeenCalled();
	});

	it('passes scope through to the service', async () => {
		vi.mocked(notesService.getNotes).mockResolvedValue(basePayload({ Scope: 'subevent' }));

		const { result } = renderHook(() => useTileNotes('evt_0_0_0', 'subevent'));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(notesService.getNotes).toHaveBeenCalledWith('evt_0_0_0', 'subevent');
	});

	it('save() calls updateNotes with the current etag and refreshes payload', async () => {
		vi.mocked(notesService.getNotes).mockResolvedValue(basePayload({ Etag: 'first==' }));
		vi.mocked(notesService.updateNotes).mockResolvedValue(
			basePayload({ UserNote: 'changed', Etag: 'next==' })
		);

		const { result } = renderHook(() => useTileNotes('evt_0_0_0'));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		await act(async () => {
			await result.current.save('changed');
		});

		expect(notesService.updateNotes).toHaveBeenCalledWith({
			EventID: 'evt_0_0_0',
			Scope: 'auto',
			UserNote: 'changed',
			Etag: 'first==',
		});
		expect(result.current.payload?.UserNote).toBe('changed');
		expect(result.current.payload?.Etag).toBe('next==');
		expect(result.current.conflict).toBeNull();
	});

	it('exposes conflict payload when server reports concurrencyConflict', async () => {
		vi.mocked(notesService.getNotes).mockResolvedValue(basePayload({ Etag: 'stale==' }));
		vi.mocked(notesService.updateNotes).mockResolvedValue(
			basePayload({
				UserNote: 'server-wins',
				Etag: 'fresh==',
				concurrencyConflict: true,
			})
		);

		const { result } = renderHook(() => useTileNotes('evt_0_0_0'));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		await act(async () => {
			await result.current.save('client-edits');
		});

		expect(result.current.conflict).not.toBeNull();
		expect(result.current.conflict?.server.UserNote).toBe('server-wins');
		expect(result.current.conflict?.localDraft).toBe('client-edits');
		// payload reflects latest server state so user can compare.
		expect(result.current.payload?.UserNote).toBe('server-wins');
		expect(result.current.payload?.Etag).toBe('fresh==');
	});

	it('clearConflict() removes the conflict marker', async () => {
		vi.mocked(notesService.getNotes).mockResolvedValue(basePayload());
		vi.mocked(notesService.updateNotes).mockResolvedValue(
			basePayload({ concurrencyConflict: true })
		);

		const { result } = renderHook(() => useTileNotes('evt_0_0_0'));
		await waitFor(() => expect(result.current.isLoading).toBe(false));

		await act(async () => {
			await result.current.save('x');
		});
		expect(result.current.conflict).not.toBeNull();

		act(() => result.current.clearConflict());
		expect(result.current.conflict).toBeNull();
	});

	it('surfaces error state when getNotes rejects', async () => {
		vi.mocked(notesService.getNotes).mockRejectedValue(new Error('boom'));

		const { result } = renderHook(() => useTileNotes('evt_0_0_0'));

		await waitFor(() => expect(result.current.isLoading).toBe(false));
		expect(result.current.error).toBeInstanceOf(Error);
		expect(result.current.payload).toBeNull();
	});
});
