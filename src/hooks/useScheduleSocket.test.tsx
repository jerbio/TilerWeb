import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { useRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import { useScheduleSocket } from './useScheduleSocket';
import usePrefetchedCalendarData from '@/core/common/hooks/usePrefetchedCalendarEvents';
import type { SubCalendarEvent } from '@/core/common/types/schedule';
import { CalendarSyncNotice } from '@/core/common/components/calendar/CalendarSyncNotice';
import NotificationToast from '@/core/ui/NotificationToast';
import useUiStore from '@/core/ui/uiStore';
import {
	deferred,
	flushSyncClient,
	syncStatus,
	syncUpdate,
} from '@/services/calendarSyncClient.fixtures';

const mocks = vi.hoisted(() => ({
	read: vi.fn(),
	lookup: vi.fn(),
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
vi.mock('@/services', () => ({
	scheduleService: { lookupScheduleByUserId: (...args: unknown[]) => mocks.lookup(...args) },
}));
vi.mock('@/config/demo_config', () => ({ isDemoMode: () => false }));
vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (_key: string, fallback: string) => fallback }),
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

const startDay = dayjs('2026-10-30T00:00:00Z');
function useConnectedCalendar() {
	const refresh = useRef<ReturnType<typeof usePrefetchedCalendarData>['refetchEvents'] | null>(
		null
	);
	const sync = useScheduleSocket(() => refresh.current?.());
	const calendar = usePrefetchedCalendarData({
		userId: mocks.state.authenticatedPersonaSession.userId,
		viewOptions: { startDay, daysInView: 7 },
		daysInView: 7,
		enabled: sync.ready,
	});
	refresh.current = calendar.refetchEvents;
	return { calendar, sync };
}

describe('schedule socket hook', () => {
	beforeEach(() => {
		mocks.read.mockReset().mockResolvedValue(null);
		mocks.lookup.mockReset().mockResolvedValue({ subCalendarEvents: [] });
		mocks.services.length = 0;
		mocks.state.activeSessionType = 'authenticated';
		mocks.state.authenticatedPersonaSession = { userId: 'owner' };
		useUiStore.getState().notification.clear();
	});

	it('keeps recovered failure history separate from a current failure notice', async () => {
		mocks.read.mockResolvedValue(
			syncStatus({ state: 'failed', errorCode: 'CalculationFailed', willRetry: false })
		);
		const { result, unmount } = renderHook(() => useScheduleSocket(vi.fn()));
		await waitFor(() => expect(result.current.status?.state).toBe('failed'));
		expect(result.current.showFailure).toBe(false);
		act(() =>
			mocks.services[0].subs.get('calendarSyncUpdated')!(
				syncUpdate('started', { attempt: 2 })
			)
		);
		act(() =>
			mocks.services[0].subs.get('calendarSyncUpdated')!(
				syncUpdate('failed', { attempt: 2, willRetry: false })
			)
		);
		expect(result.current.showFailure).toBe(true);
		unmount();
	});

	it('does not recreate the historical toast on page remount but shows a new calculation failure', async () => {
		mocks.read.mockResolvedValue(
			syncStatus({
				state: 'failed',
				generation: 27,
				requestedGeneration: 27,
				completedGeneration: 26,
				attempt: 5,
				errorCode: 'CalculationFailed',
				willRetry: false,
			})
		);
		function Calendar() {
			const sync = useScheduleSocket(vi.fn());
			return (
				<>
					<CalendarSyncNotice {...sync} />
					<NotificationToast />
				</>
			);
		}
		const first = render(<Calendar />);
		await act(flushSyncClient);
		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
		first.unmount();
		const second = render(<Calendar />);
		await act(flushSyncClient);
		expect(screen.queryByTestId('notification-toast')).not.toBeInTheDocument();
		const socket = mocks.services[1];
		act(() =>
			socket.subs.get('calendarSyncUpdated')!({
				...syncUpdate('started', { generation: 28 }),
				state: 'progress',
				activity: 'recalculating',
				sequence: 2,
			})
		);
		expect(screen.getByTestId('notification-icon-loading')).toBeInTheDocument();
		act(() =>
			socket.subs.get('calendarSyncUpdated')!(
				syncUpdate('failed', {
					generation: 28,
					sequence: 3,
					errorCode: 'CalculationFailed',
					willRetry: false,
				})
			)
		);
		expect(screen.getByText('Calendar updates could not be completed.')).toBeInTheDocument();
		expect(screen.queryByTestId('notification-icon-loading')).not.toBeInTheDocument();
		second.unmount();
	});

	it('does not carry a current failure notice across an account change', async () => {
		const { result, rerender, unmount } = renderHook(() => useScheduleSocket(vi.fn()));
		act(() =>
			mocks.services[0].subs.get('calendarSyncUpdated')!(
				syncUpdate('failed', { willRetry: false })
			)
		);
		expect(result.current.showFailure).toBe(true);
		mocks.state.authenticatedPersonaSession = { userId: 'other-owner' };
		rerender();
		expect(result.current.showFailure).toBe(false);
		await act(flushSyncClient);
		expect(result.current.showFailure).toBe(false);
		unmount();
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

	it('uses the first connection for initial loading and refreshes on later reconnects', async () => {
		mocks.read.mockResolvedValue(syncStatus());
		const refresh = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() => useScheduleSocket(refresh));
		await waitFor(() => expect(result.current.status).toEqual(syncStatus()));
		expect(refresh).not.toHaveBeenCalled();
		expect(result.current.ready).toBe(false);
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(result.current.ready).toBe(true));
		expect(mocks.read).toHaveBeenCalledOnce();
		expect(refresh).not.toHaveBeenCalled();
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
		expect(mocks.read).toHaveBeenCalledTimes(2);
	});

	it('loads each of the three startup ranges once after the initial connection is ready', async () => {
		const initial = deferred<{ subCalendarEvents: SubCalendarEvent[] }>();
		const events = (id: string) => [{ id }] as SubCalendarEvent[];
		mocks.read.mockResolvedValue(syncStatus());
		mocks.lookup.mockReturnValueOnce(initial.promise);
		const { result } = renderHook(useConnectedCalendar);
		await waitFor(() => expect(result.current.sync.status).toEqual(syncStatus()));
		expect(mocks.lookup).not.toHaveBeenCalled();
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(3));
		await act(async () => initial.resolve({ subCalendarEvents: events('fresh') }));
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		expect(result.current.calendar.events).toEqual(events('fresh'));
		expect(mocks.lookup).toHaveBeenCalledTimes(3);
		expect(mocks.read).toHaveBeenCalledOnce();
		const ranges = mocks.lookup.mock.calls.map(([, range]) => JSON.stringify(range));
		expect(new Set(ranges).size).toBe(3);
	});

	it('includes startup changes in the first load and still refreshes for later notifications', async () => {
		const { result } = renderHook(useConnectedCalendar);
		await act(async () => {
			mocks.services[0].subs.get('calendarSyncUpdated')!(syncUpdate());
			mocks.services[0].subs.get('refereshDataFromSockets')!({
				refreshData: { trigger: true },
			});
			await flushSyncClient();
		});
		expect(mocks.lookup).not.toHaveBeenCalled();
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		expect(mocks.lookup).toHaveBeenCalledTimes(3);
		act(() =>
			mocks.services[0].subs.get('refereshDataFromSockets')!({
				refreshData: { trigger: true },
			})
		);
		await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(6));
	});

	it.each(['disabled', 'failed'] as const)(
		'loads once and catches up on reconnect when status is %s',
		async (status) => {
			if (status === 'failed') mocks.read.mockRejectedValue(new Error('unavailable'));
			const { result } = renderHook(useConnectedCalendar);
			act(() => mocks.services[0].connected!());
			await waitFor(() => expect(result.current.calendar.loading).toBe(false));
			expect(mocks.lookup).toHaveBeenCalledTimes(3);
			act(() => mocks.services[0].connected!());
			await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(6));
		}
	);

	it('loads after a bounded wait without a socket and refreshes when the connection arrives late', async () => {
		vi.useFakeTimers();
		const { result, unmount } = renderHook(useConnectedCalendar);
		try {
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1999);
			});
			expect(mocks.lookup).not.toHaveBeenCalled();
			await act(async () => {
				await vi.advanceTimersByTimeAsync(1);
			});
			expect(result.current.calendar.loading).toBe(false);
			expect(mocks.lookup).toHaveBeenCalledTimes(3);
			await act(async () => {
				mocks.services[0].connected!();
				await flushSyncClient();
			});
			expect(mocks.lookup).toHaveBeenCalledTimes(6);
		} finally {
			unmount();
			vi.useRealTimers();
		}
	});

	it('discards a superseded reconnect response without refreshing again', async () => {
		const older = deferred<ReturnType<typeof syncStatus>>();
		const { result } = renderHook(useConnectedCalendar);
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		mocks.read.mockReturnValueOnce(older.promise);
		act(() => mocks.services[0].connected!());
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(6));
		await act(async () => older.resolve(syncStatus()));
		expect(mocks.lookup).toHaveBeenCalledTimes(6);
	});

	it('loads anonymous calendars immediately without waiting for a socket', async () => {
		mocks.state.activeSessionType = 'anonymous';
		const { result } = renderHook(useConnectedCalendar);
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		expect(mocks.services).toHaveLength(0);
		expect(mocks.lookup).toHaveBeenCalledTimes(3);
	});

	it('refreshes immediately after reconnect without waiting for metadata or refreshing again when it arrives', async () => {
		const { result } = renderHook(useConnectedCalendar);
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		const pending = deferred<ReturnType<typeof syncStatus>>();
		mocks.read.mockReturnValueOnce(pending.promise);
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(6));
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		expect(result.current.sync.status).toBeNull();
		await act(async () => pending.resolve(syncStatus()));
		expect(result.current.sync.status).toEqual(syncStatus());
		expect(mocks.lookup).toHaveBeenCalledTimes(6);
	});

	it('loads immediately on first connection while mount metadata hangs, without fetching status again', async () => {
		const pending = deferred<ReturnType<typeof syncStatus>>();
		mocks.read.mockReturnValue(pending.promise);
		const { result } = renderHook(useConnectedCalendar);
		act(() => mocks.services[0].connected!());
		expect(result.current.sync.ready).toBe(true);
		expect(mocks.lookup).toHaveBeenCalledTimes(3);
		await waitFor(() => expect(result.current.calendar.loading).toBe(false));
		expect(mocks.read).toHaveBeenCalledOnce();
		await act(async () => pending.resolve(syncStatus()));
		expect(mocks.lookup).toHaveBeenCalledTimes(3);
		expect(result.current.sync.status).toEqual(syncStatus());
		// Metadata may describe a completion committed after the initial lookup.
		// Receiving its socket notification must still refresh the calendar.
		act(() => mocks.services[0].subs.get('calendarSyncUpdated')!(syncUpdate()));
		await waitFor(() => expect(mocks.lookup).toHaveBeenCalledTimes(6));
	});

	it('recovers missed updates on reconnect even when the native revision did not change', async () => {
		const refresh = vi.fn();
		const { result } = renderHook(() => useScheduleSocket(refresh));
		act(() => mocks.services[0].connected!());
		await waitFor(() => expect(result.current.ready).toBe(true));
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
		expect(result.current.ready).toBe(false);
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
