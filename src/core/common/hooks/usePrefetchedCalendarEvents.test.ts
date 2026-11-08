import { act, renderHook, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useAppStore from '@/global_state';
import { scheduleService } from '@/services';
import type { SubCalendarEvent } from '../types/schedule';
import usePrefetchedCalendarData from './usePrefetchedCalendarEvents';

vi.mock('@/services', () => ({
	scheduleService: { lookupScheduleByUserId: vi.fn() },
}));
vi.mock('@/config/demo_config', () => ({ isDemoMode: () => false }));
vi.mock('@/global_state', async () => {
	const { create } = await import('zustand');
	return {
		default: create(() => ({
			activeSessionType: 'anonymous',
			anonymousPersonaSession: { personaId: 'persona-1', scheduleId: 'schedule-1' },
		})),
	};
});

const lookup = vi.mocked(scheduleService.lookupScheduleByUserId);
const event = (id: string) => ({ id }) as SubCalendarEvent;
const options = (date = '2026-10-29', days = 11) => ({
	userId: 'user-1' as string | null,
	viewOptions: { startDay: dayjs(date), daysInView: days },
	daysInView: days,
});

function deferred() {
	let resolve!: (value: { subCalendarEvents: SubCalendarEvent[] }) => void;
	const promise = new Promise<{ subCalendarEvents: SubCalendarEvent[] }>((complete) => {
		resolve = complete;
	});
	return { promise, resolve };
}

describe('calendar schedule loading', () => {
	beforeEach(() => {
		lookup.mockReset().mockResolvedValue({ subCalendarEvents: [] });
		useAppStore.setState({
			anonymousPersonaSession: {
				personaId: 'persona-1',
				scheduleId: 'schedule-1',
			} as NonNullable<ReturnType<typeof useAppStore.getState>['anonymousPersonaSession']>,
		});
	});

	it.each(['2026-10-29', '2026-03-05'])(
		'loads the full visible range and contiguous midnight prefetches across DST from %s',
		async (date) => {
			const { result } = renderHook(() => usePrefetchedCalendarData(options(date)));
			await waitFor(() => expect(result.current.loading).toBe(false));
			const start = dayjs(date);
			const end = start.add(11, 'day');
			expect(lookup.mock.calls).toEqual([
				['user-1', { startRange: start.valueOf(), endRange: end.valueOf() }],
				['user-1', { startRange: end.valueOf(), endRange: end.add(11, 'day').valueOf() }],
				[
					'user-1',
					{ startRange: start.subtract(11, 'day').valueOf(), endRange: start.valueOf() },
				],
			]);
		}
	);

	it('ignores a delayed initial load after a socket refresh', async () => {
		const initial = deferred();
		lookup.mockReturnValueOnce(initial.promise);
		const { result } = renderHook(() => usePrefetchedCalendarData(options()));
		lookup.mockResolvedValue({ subCalendarEvents: [event('updated')] });
		await act(async () => result.current.refetchEvents());
		await act(async () => initial.resolve({ subCalendarEvents: [event('old')] }));
		expect(result.current.events).toEqual([event('updated')]);
	});

	it('ignores a delayed socket refresh after navigating to another range', async () => {
		const { result, rerender } = renderHook(usePrefetchedCalendarData, {
			initialProps: options(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		const refresh = deferred();
		lookup.mockReturnValueOnce(refresh.promise);
		let refreshing!: Promise<void>;
		act(() => {
			refreshing = result.current.refetchEvents();
		});
		lookup.mockResolvedValue({ subCalendarEvents: [event('new-range')] });
		rerender(options('2026-11-20'));
		await waitFor(() => expect(result.current.events).toEqual([event('new-range')]));
		await act(async () => {
			refresh.resolve({ subCalendarEvents: [event('old-range')] });
			await refreshing;
		});
		expect(result.current.events).toEqual([event('new-range')]);
	});

	it('keeps the newest refresh when socket responses finish out of order', async () => {
		const { result } = renderHook(() => usePrefetchedCalendarData(options()));
		await waitFor(() => expect(result.current.loading).toBe(false));
		const old = deferred();
		lookup.mockReturnValueOnce(old.promise);
		let oldRefresh!: Promise<void>;
		act(() => {
			oldRefresh = result.current.refetchEvents();
		});
		lookup.mockResolvedValue({ subCalendarEvents: [event('latest')] });
		await act(async () => result.current.refetchEvents());
		await act(async () => {
			old.resolve({ subCalendarEvents: [event('stale')] });
			await oldRefresh;
		});
		expect(result.current.events).toEqual([event('latest')]);
	});

	it('does not let old prefetches repopulate the cache after refresh', async () => {
		const oldPrefetch = deferred();
		lookup
			.mockResolvedValueOnce({ subCalendarEvents: [] })
			.mockReturnValueOnce(oldPrefetch.promise);
		const { result, rerender } = renderHook(usePrefetchedCalendarData, {
			initialProps: options(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		lookup.mockResolvedValue({ subCalendarEvents: [event('fresh')] });
		await act(async () => result.current.refetchEvents());
		await act(async () => oldPrefetch.resolve({ subCalendarEvents: [event('stale')] }));
		rerender(options('2026-11-09'));
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.events).toEqual([event('fresh')]);
	});

	it('reloads when the persona changes even if the user and schedule IDs stay the same', async () => {
		const { result } = renderHook(() => usePrefetchedCalendarData(options()));
		await waitFor(() => expect(result.current.loading).toBe(false));
		lookup.mockClear().mockResolvedValue({ subCalendarEvents: [event('persona-2')] });
		act(() =>
			useAppStore.setState((state) => ({
				anonymousPersonaSession: {
					...state.anonymousPersonaSession!,
					personaId: 'persona-2',
				},
			}))
		);
		await waitFor(() => expect(result.current.events).toEqual([event('persona-2')]));
		expect(lookup).toHaveBeenCalledTimes(3);
	});

	it('clears events and makes no requests without a user or a visible range', async () => {
		const { result, rerender } = renderHook(usePrefetchedCalendarData, {
			initialProps: options(),
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		lookup.mockClear();
		rerender({ ...options(), userId: null });
		expect(result.current.events).toEqual([]);
		expect(result.current.loading).toBe(false);
		rerender(options('2026-10-29', 0));
		expect(lookup).not.toHaveBeenCalled();
	});

	it('finishes loading after a failed lookup and can retry', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		try {
			lookup.mockRejectedValue(new Error('Lookup failed'));
			const { result } = renderHook(() => usePrefetchedCalendarData(options()));
			await waitFor(() => expect(result.current.loading).toBe(false));
			lookup.mockResolvedValue({ subCalendarEvents: [event('recovered')] });
			await act(async () => result.current.refetchEvents());
			expect(result.current.events).toEqual([event('recovered')]);
		} finally {
			consoleError.mockRestore();
		}
	});
});
