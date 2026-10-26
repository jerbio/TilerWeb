import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTilettePreviewResponse } from '../useTilettePreviewResponse';
const mocks = vi.hoisted(() => ({ accept: vi.fn(), response: vi.fn(), decline: vi.fn() }));
vi.mock('@/core/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'viewer' } }) }));
vi.mock('@/api/tileshareApi', () => ({
	TileshareApi: class {
		acceptAssignment = mocks.accept;
		getAssignmentResponse = mocks.response;
		respondToInvitation = mocks.decline;
	},
}));
const timeline = { StartTimeUnixMsUtc: 1791100800000, DurationInMs: 1800000 };
const accepted = {
	id: 'mine',
	invitationStatus: 'accepted',
	calendarId: 'calendar',
	lockedSessions: [timeline],
};
const storageKey = 'tileshare-preview:viewer:mine';
beforeEach(() => {
	vi.resetAllMocks();
	sessionStorage.clear();
});
describe('direct assignment acceptance', () => {
	it('accepts without a preview token or recovery read', async () => {
		mocks.accept.mockResolvedValue(accepted);
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await result.current.accept();
		});
		expect(mocks.accept).toHaveBeenCalledWith('mine', undefined);
		expect(result.current.state).toBe('accepted');
		expect(result.current.calendarId).toBe('calendar');
		expect(mocks.response).not.toHaveBeenCalled();
	});
	it('retains only the selected lock when reopening and retrying', async () => {
		mocks.accept.mockRejectedValue(new Error('offline'));
		mocks.response.mockRejectedValue(new Error('offline'));
		const first = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await first.result.current.accept(timeline);
		});
		expect(JSON.parse(sessionStorage.getItem(storageKey)!)).toEqual({
			lockedTimeLineRequest: timeline,
		});
		first.unmount();
		mocks.accept.mockResolvedValue(accepted);
		const reopened = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await reopened.result.current.accept();
		});
		expect(mocks.accept.mock.calls[1]).toEqual(['mine', timeline]);
		expect(reopened.result.current.state).toBe('accepted');
		expect(sessionStorage.getItem(storageKey)).toBeNull();
	});
	it('checks the assignment after a lost response without resubmitting acceptance', async () => {
		mocks.accept.mockRejectedValue(new Error('timeout'));
		mocks.response.mockResolvedValue(accepted);
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await result.current.accept(timeline);
		});
		await act(async () => result.current.check());
		expect(result.current.state).toBe('accepted');
		expect(mocks.accept).toHaveBeenCalledTimes(1);
	});
	it('does not report lock success when only RSVP was accepted', async () => {
		mocks.accept.mockResolvedValue({ ...accepted, lockedSessions: [] });
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await result.current.accept(timeline);
		});
		expect(result.current.state).toBe('rejected');
	});
	it.each([{ code: '409' }, { status: 400 }, { Error: { Code: 400 } }])(
		'treats a validation failure as rejected, not still accepting',
		async (error) => {
			mocks.accept.mockRejectedValue(error);
			const { result } = renderHook(() => useTilettePreviewResponse('mine'));
			await act(async () => {
				await result.current.accept(timeline);
			});
			expect(result.current.state).toBe('rejected');
			expect(result.current.pending).toBeNull();
		}
	);
	it('keeps an unresolved read uncertain', async () => {
		mocks.accept.mockRejectedValue(new Error('timeout'));
		mocks.response.mockResolvedValue({ id: 'mine', invitationStatus: 'none' });
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await result.current.accept();
		});
		await act(async () => result.current.check());
		expect(result.current.state).toBe('uncertain');
		expect(result.current.pending).not.toBeNull();
	});
	it('rejects a response for a different assignment', async () => {
		mocks.accept.mockResolvedValue({ ...accepted, id: 'someone-else' });
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		await act(async () => {
			await result.current.accept();
		});
		expect(result.current.state).toBe('uncertain');
	});
	it('ignores a stale status read after retrying acceptance', async () => {
		sessionStorage.setItem(storageKey, JSON.stringify({ lockedTimeLineRequest: timeline }));
		let resolve!: (value: unknown) => void;
		mocks.response.mockImplementation(
			() =>
				new Promise((r) => {
					resolve = r;
				})
		);
		const { result } = renderHook(() => useTilettePreviewResponse('mine'));
		const signal = mocks.response.mock.calls[0][1] as AbortSignal;
		mocks.accept.mockResolvedValue(accepted);
		await act(async () => {
			await result.current.accept();
		});
		expect(signal.aborted).toBe(true);
		await act(async () => resolve({ id: 'mine', invitationStatus: 'none' }));
		expect(result.current.state).toBe('accepted');
	});
	it('ignores recovery references belonging to another assignment', () => {
		sessionStorage.setItem(storageKey, JSON.stringify({}));
		renderHook(() => useTilettePreviewResponse('other'));
		expect(mocks.response).not.toHaveBeenCalled();
	});
});
