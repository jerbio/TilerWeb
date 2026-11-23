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
	enabled = true,
}: {
	userId: string | null;
	viewOptions: { startDay: dayjs.Dayjs; daysInView: number };
	daysInView: number;
	enabled?: boolean;
}) {
	const latestLookupRequestRef = useRef(0);
	const mountedRef = useRef(true);
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
	const scope = JSON.stringify([personaId, userId, scheduleId]);
	const scopeRef = useRef(scope);
	if (scopeRef.current !== scope) {
		scopeRef.current = scope;
		latestLookupRequestRef.current++;
		scheduleCacheRef.current = new Map();
	}
	const start = viewOptions.startDay.startOf('day').valueOf();

	useEffect(() => {
		setEvents([]);
	}, [scope]);

	const fetchSchedule = useCallback(
		async (id: string, startRange: number, endRange: number) => {
			const cacheKey = JSON.stringify([scope, id, startRange, endRange]);
			// Refreshing replaces this cache instance. Old requests cannot populate
			// a fresh cache or a different account/persona's cache.
			const cache = scheduleCacheRef.current;
			if (isDemoMode()) return getDemoData().calendarEvents;
			const cached = cache.get(cacheKey);
			if (cached) return cached;

			const lookup = await scheduleService.lookupScheduleByUserId(id, {
				startRange,
				endRange,
			});
			if (
				mountedRef.current &&
				scopeRef.current === scope &&
				scheduleCacheRef.current === cache
			) {
				cache.set(cacheKey, lookup.subCalendarEvents);
				if (cache.size > MAX_CACHE_ENTRIES) {
					const firstKey = cache.keys().next().value;
					if (firstKey !== undefined) cache.delete(firstKey);
				}
			}
			return lookup.subCalendarEvents;
		},
		[scope]
	);

	const loadEvents = useCallback(
		async (refresh = false) => {
			const requestId = ++latestLookupRequestRef.current;
			if (refresh) scheduleCacheRef.current = new Map();
			if (!enabled || !userId || daysInView <= 0) {
				setEvents([]);
				setLoading(false);
				return false;
			}
			const current = () =>
				mountedRef.current &&
				scopeRef.current === scope &&
				latestLookupRequestRef.current === requestId;

			// Calendar days can be 23 or 25 hours. Keep the visible and adjacent
			// ranges contiguous at local midnight across DST changes.
			const startDay = dayjs(start);
			const endDay = startDay.add(daysInView, 'day');
			setLoading(true);
			const visibleRequest = fetchSchedule(userId, start, endDay.valueOf());
			const prefetch = (rangeStart: dayjs.Dayjs, rangeEnd: dayjs.Dayjs) => {
				void fetchSchedule(userId, rangeStart.valueOf(), rangeEnd.valueOf()).catch(
					() => {}
				);
			};
			prefetch(endDay, endDay.add(daysInView, 'day'));
			prefetch(startDay.subtract(daysInView, 'day'), startDay);

			try {
				const refreshedEvents = await visibleRequest;
				if (current()) {
					setEvents(refreshedEvents);
					return true;
				}
				return false;
			} finally {
				// Keep the saved view on failure and propagate explicit refresh failures
				// to the sync client so its retry/error feedback stays accurate.
				if (current()) setLoading(false);
			}
		},
		[enabled, userId, start, daysInView, scope, fetchSchedule]
	);

	useEffect(() => {
		const requestCounter = latestLookupRequestRef;
		const mounted = mountedRef;
		mounted.current = true;
		void loadEvents().catch(() => {});
		return () => {
			mounted.current = false;
			requestCounter.current++;
		};
	}, [loadEvents]);

	const refetchEvents = useCallback(() => loadEvents(true), [loadEvents]);
	return { events, loading: loading || !enabled, refetchEvents };
}
