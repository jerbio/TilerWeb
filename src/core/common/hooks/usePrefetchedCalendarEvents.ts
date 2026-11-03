import { useCallback, useEffect, useRef, useState } from 'react';
import { scheduleService } from '@/services';
import { SubCalendarEvent } from '../types/schedule';
import useAppStore from '../../../global_state';
import dayjs from 'dayjs';
import { getDemoData, isDemoMode } from '@/config/demo_config';

const MAX_CACHE_ENTRIES = 12;

export default function usePrefetchedCalendarData({
	userId,
	viewOptions,
	daysInView,
}: {
	userId: string | null;
	viewOptions: { startDay: dayjs.Dayjs; daysInView: number };
	daysInView: number;
}) {
	const latestLookupRequestRef = useRef(0);
	const scheduleCacheRef = useRef(new Map<string, Array<SubCalendarEvent>>());
	const [events, setEvents] = useState<Array<SubCalendarEvent>>([]);
	const [loading, setLoading] = useState(true);

	const activePersonaSession = useAppStore((state) =>
		state.activeSessionType === 'anonymous'
			? state.anonymousPersonaSession
			: state.authenticatedPersonaSession
	);
	const scheduleId = activePersonaSession?.scheduleId;
	const personaId = activePersonaSession?.personaId;
	const start = viewOptions.startDay.startOf('day').valueOf();

	const fetchSchedule = useCallback(
		async (id: string, startRange: number, endRange: number) => {
			const cacheKey = JSON.stringify([personaId, id, scheduleId, startRange, endRange]);
			// A refresh replaces this cache instance, so older requests cannot
			// repopulate the new cache with pre-refresh results.
			const cache = scheduleCacheRef.current;
			if (isDemoMode()) return getDemoData().calendarEvents;
			const cached = cache.get(cacheKey);
			if (cached) return cached;

			const lookup = await scheduleService.lookupScheduleByUserId(id, {
				startRange,
				endRange,
			});
			cache.set(cacheKey, lookup.subCalendarEvents);
			if (cache.size > MAX_CACHE_ENTRIES) {
				const firstKey = cache.keys().next().value;
				if (firstKey !== undefined) cache.delete(firstKey);
			}
			return lookup.subCalendarEvents;
		},
		[personaId, scheduleId]
	);

	const loadEvents = useCallback(
		async (refresh = false) => {
			const requestId = ++latestLookupRequestRef.current;
			if (refresh) scheduleCacheRef.current = new Map();
			if (!userId || daysInView <= 0) {
				setEvents([]);
				setLoading(false);
				return;
			}

			// Calendar days may be 23 or 25 hours. All three requests use local
			// midnight boundaries, including ranges that cross a DST change.
			const startDay = dayjs(start);
			const endDay = startDay.add(daysInView, 'day');
			setLoading(true);
			const visibleRequest = fetchSchedule(userId, start, endDay.valueOf());
			const prefetch = (rangeStart: dayjs.Dayjs, rangeEnd: dayjs.Dayjs) => {
				void fetchSchedule(userId, rangeStart.valueOf(), rangeEnd.valueOf()).catch(
					(error) => console.error('Error prefetching calendar events', error)
				);
			};
			prefetch(endDay, endDay.add(daysInView, 'day'));
			prefetch(startDay.subtract(daysInView, 'day'), startDay);

			try {
				const refreshedEvents = await visibleRequest;
				if (latestLookupRequestRef.current === requestId) setEvents(refreshedEvents);
			} catch (error) {
				console.error('Error loading calendar events', error);
			} finally {
				if (latestLookupRequestRef.current === requestId) setLoading(false);
			}
		},
		[userId, start, daysInView, fetchSchedule]
	);

	useEffect(() => {
		const requestCounter = latestLookupRequestRef;
		void loadEvents();
		return () => {
			// Invalidate initial loads and socket refreshes when navigating,
			// switching personas, or unmounting.
			requestCounter.current++;
		};
	}, [loadEvents]);

	const refetchEvents = useCallback(() => loadEvents(true), [loadEvents]);
	return { events, loading, refetchEvents };
}
