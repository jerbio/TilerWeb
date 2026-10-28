import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useScheduleSocket } from './useScheduleSocket';
import { deferred, syncStatus, syncUpdate } from '@/services/calendarSyncClient.fixtures';

const mocks = vi.hoisted(() => ({
	read: vi.fn(),
	services: [] as Array<{
		subs: Map<string, (value: unknown) => void>;
		connected: (() => void) | null;
		disposed: boolean;
	}>,
	state: { activeSessionType: 'authenticated', authenticatedPersonaSession: { userId: 'owner' } },
}));
vi.mock('@/global_state', () => ({
	SessionType: { AUTHENTICATED: 'authenticated' },
	default: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}));
vi.mock('@/api/calendarSyncApi', () => ({
	CalendarSyncApi: class {
		getStatus = () => mocks.read();
	},
}));
vi.mock('@/services/SocketService', () => ({
	Hubs: {
		ScheduleChange: {
			name: 'scheduleChange',
			events: {
				RefreshData: 'refereshDataFromSockets',
				CalendarSyncUpdated: 'calendarSyncUpdated',
			},
		},
	},
	SignalRService: class {
		subs = new Map<string, (value: unknown) => void>();
		connected: (() => void) | null = null;
		disposed = false;
		constructor() {
			mocks.services.push(this);
		}
		subscribe(_hub: string, method: string, callback: (value: unknown) => void) {
			this.subs.set(method, callback);
		}
		onConnected(callback: () => void) {
			this.connected = callback;
		}
		createConnection() {}
		dispose() {
			this.disposed = true;
			this.subs.clear();
			this.connected = null;
		}
	},
}));

describe('schedule socket hook', () => {
	beforeEach(() => {
		mocks.read.mockReset().mockResolvedValue(null);
		mocks.services.length = 0;
		mocks.state.activeSessionType = 'authenticated';
		mocks.state.authenticatedPersonaSession = { userId: 'owner' };
	});

	it('listens for status and refresh on one shared service and deduplicates completion', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		const { result, unmount } = renderHook(() => useScheduleSocket(refresh));
		expect(mocks.services).toHaveLength(1);
		const socket = mocks.services[0];
		const update = syncUpdate();
		act(() => {
			socket.subs.get('calendarSyncUpdated')!(update);
			socket.subs.get('refereshDataFromSockets')!({ calendarSync: update });
		});
		await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
		expect(result.current.status?.state).toBe('completed');
		unmount();
		expect(socket.disposed).toBe(true);
	});

	it('recovers missed updates on reconnect even when the native revision did not change', async () => {
		const refresh = vi.fn();
		const { result } = renderHook(() => useScheduleSocket(refresh));
		mocks.read.mockResolvedValueOnce(syncStatus());
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
		expect(result.current.status?.state).toBe('completed');
	});
	it('refreshes independently saved changes after calculation failure and keeps the failure visible', async () => {
		const refresh = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() => useScheduleSocket(refresh));
		const failed = syncUpdate('failed', { errorCode: 'CalculationFailed', willRetry: false });
		act(() => mocks.services[0].subs.get('calendarSyncUpdated')!(failed));
		await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
		expect(result.current.status).toEqual(failed);
		expect(result.current.refreshError).toBe(false);
	});

	it('uses the newest callback without replacing the connection', async () => {
		const first = vi.fn();
		const second = vi.fn();
		const { rerender } = renderHook(({ callback }) => useScheduleSocket(callback), {
			initialProps: { callback: first },
		});
		rerender({ callback: second });
		act(() => mocks.services[0].subs.get('calendarSyncUpdated')!(syncUpdate()));
		await waitFor(() => expect(second).toHaveBeenCalledOnce());
		expect(first).not.toHaveBeenCalled();
		expect(mocks.services).toHaveLength(1);
	});

	it('discards pending status and queued callbacks from a previous owner', async () => {
		const pending = deferred<ReturnType<typeof syncStatus>>();
		mocks.read.mockReturnValueOnce(pending.promise);
		const refresh = vi.fn();
		const { result, rerender } = renderHook(() => useScheduleSocket(refresh));
		const previous = mocks.services[0];
		const oldCallback = previous.subs.get('calendarSyncUpdated')!;
		mocks.state.authenticatedPersonaSession = { userId: 'new-owner' };
		rerender();
		await act(async () => {
			pending.resolve(syncStatus());
			oldCallback(syncUpdate());
		});
		expect(previous.disposed).toBe(true);
		expect(result.current.status).toBeNull();
		expect(refresh).not.toHaveBeenCalled();
	});

	it('does not open the user sync connection for an anonymous persona', () => {
		mocks.state.activeSessionType = 'anonymous';
		renderHook(() => useScheduleSocket(vi.fn()));
		expect(mocks.services).toHaveLength(0);
		expect(mocks.read).not.toHaveBeenCalled();
	});

	it('surfaces a failed refresh and retries the read without recalculating', async () => {
		const refresh = vi
			.fn()
			.mockRejectedValueOnce(new Error('unavailable'))
			.mockResolvedValue(undefined);
		const { result } = renderHook(() => useScheduleSocket(refresh));
		act(() => mocks.services[0].subs.get('calendarSyncUpdated')!(syncUpdate()));
		await waitFor(() => expect(result.current.refreshError).toBe(true));
		act(() => result.current.retry());
		await waitFor(() => expect(result.current.refreshError).toBe(false));
		expect(refresh).toHaveBeenCalledTimes(2);
	});
});
