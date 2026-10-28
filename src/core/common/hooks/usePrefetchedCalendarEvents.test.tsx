import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import usePrefetchedCalendarData from './usePrefetchedCalendarEvents';
import { deferred } from '@/services/calendarSyncClient.fixtures';
import type { SubCalendarEvent } from '../types/schedule';

const mocks = vi.hoisted(() => ({
	lookup: vi.fn(),
	state: {
		activeSessionType: 'authenticated',
		authenticatedPersonaSession: { personaId: 'persona', scheduleId: 'schedule' },
	},
}));
vi.mock('@/services', () => ({
	scheduleService: { lookupScheduleByUserId: (...args: unknown[]) => mocks.lookup(...args) },
}));
vi.mock('@/global_state', () => ({
	default: (selector: (state: typeof mocks.state) => unknown) => selector(mocks.state),
}));
vi.mock('@/config/demo_config', () => ({ isDemoMode: () => false }));
const day = dayjs('2026-10-24T00:00:00Z');
const events = (id: string) => [{ id }] as SubCalendarEvent[];
const response = (id: string) => ({ subCalendarEvents: events(id) });
const props = (userId = 'owner', startDay = day) => ({
	userId,
	viewOptions: { startDay, daysInView: 1 },
	daysInView: 1,
});

describe('calendar visible reads and invalidated prefetches', () => {
	beforeEach(() => {
		mocks.lookup.mockReset().mockResolvedValue(response('initial'));
		mocks.state.authenticatedPersonaSession = { personaId: 'persona', scheduleId: 'schedule' };
	});

	it('an older initial read cannot overwrite a forced refresh', async () => {
		const initial = deferred<ReturnType<typeof response>>();
		mocks.lookup.mockReturnValueOnce(initial.promise);
		const { result } = renderHook(() => usePrefetchedCalendarData(props()));
		mocks.lookup.mockResolvedValue(response('fresh'));
		await act(async () => result.current.refetchEvents());
		await act(async () => initial.resolve(response('stale')));
		expect(result.current.events).toEqual(events('fresh'));
		expect(result.current.loading).toBe(false);
	});

	it('an older forced refresh cannot overwrite a newer forced refresh', async () => {
		const { result } = renderHook(() => usePrefetchedCalendarData(props()));
		await waitFor(() => expect(result.current.loading).toBe(false));
		const older = deferred<ReturnType<typeof response>>();
		mocks.lookup.mockReturnValueOnce(older.promise);
		let pending!: Promise<void>;
		act(() => {
			pending = result.current.refetchEvents();
		});
		mocks.lookup.mockResolvedValue(response('newer'));
		await act(async () => result.current.refetchEvents());
		await act(async () => {
			older.resolve(response('older'));
			await pending;
		});
		expect(result.current.events).toEqual(events('newer'));
	});

	it('a read for the previous visible range cannot replace the new range', async () => {
		const { result, rerender } = renderHook((input) => usePrefetchedCalendarData(input), {
			initialProps: props(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		const older = deferred<ReturnType<typeof response>>();
		mocks.lookup.mockReturnValueOnce(older.promise);
		let pending!: Promise<void>;
		act(() => {
			pending = result.current.refetchEvents();
		});
		mocks.lookup.mockResolvedValue(response('new-range'));
		rerender(props('owner', day.add(5, 'day')));
		await waitFor(() => expect(result.current.events).toEqual(events('new-range')));
		await act(async () => {
			older.resolve(response('old-range'));
			await pending;
		});
		expect(result.current.events).toEqual(events('new-range'));
	});

	it('previous-owner responses cannot enter the new account view', async () => {
		const older = deferred<ReturnType<typeof response>>();
		mocks.lookup.mockReturnValueOnce(older.promise);
		const { result, rerender } = renderHook((input) => usePrefetchedCalendarData(input), {
			initialProps: props(),
		});
		mocks.lookup.mockResolvedValue(response('new-owner'));
		rerender(props('new-owner'));
		await waitFor(() => expect(result.current.events).toEqual(events('new-owner')));
		await act(async () => older.resolve(response('old-owner')));
		expect(result.current.events).toEqual(events('new-owner'));
	});

	it('invalidated adjacent prefetches cannot repopulate the fresh cache', async () => {
		const oldNext = deferred<ReturnType<typeof response>>();
		mocks.lookup.mockImplementation((_id: string, range: { startRange: number }) =>
			range.startRange === day.add(1, 'day').valueOf()
				? oldNext.promise
				: Promise.resolve(response('initial'))
		);
		const { result, rerender } = renderHook((input) => usePrefetchedCalendarData(input), {
			initialProps: props(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		mocks.lookup.mockResolvedValue(response('fresh-prefetch'));
		await act(async () => result.current.refetchEvents());
		await act(async () => oldNext.resolve(response('stale-prefetch')));
		rerender(props('owner', day.add(1, 'day')));
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.events).toEqual(events('fresh-prefetch'));
	});

	it('a failed visible refresh retains the saved view and propagates failure for feedback', async () => {
		const { result } = renderHook(() => usePrefetchedCalendarData(props()));
		await waitFor(() => expect(result.current.loading).toBe(false));
		mocks.lookup.mockRejectedValueOnce(new Error('unavailable'));
		await act(async () => {
			await expect(result.current.refetchEvents()).rejects.toThrow('unavailable');
		});
		expect(result.current.events).toEqual(events('initial'));
		expect(result.current.loading).toBe(false);
	});
});
