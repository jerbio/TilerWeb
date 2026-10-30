import { useEffect, useRef, useState } from 'react';
import TimeUtil from '../../util/time';
import { scheduleService } from '@/services';
import { SubCalendarEvent } from '../types/schedule';
import useAppStore from '../../../global_state';
import dayjs from 'dayjs';
import { getDemoData, isDemoMode } from '@/config/demo_config';

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
	const MAX_CACHE_ENTRIES = 12;

	const latestLookupRequestRef = useRef(0);
	const cacheGenerationRef = useRef(0);
	const mountedRef = useRef(true);
	const scheduleCacheRef = useRef<Map<string, Array<SubCalendarEvent>>>(new Map());

	const [events, setEvents] = useState<Array<SubCalendarEvent>>([]);
	const [loading, setLoading] = useState(true);

	// Get scheduleId from the active persona session to ensure consistency
	const activeSessionType = useAppStore((state) => state.activeSessionType);
	const activePersonaSession = useAppStore((state) =>
		activeSessionType === 'anonymous'
			? state.anonymousPersonaSession
			: state.authenticatedPersonaSession
	);
	const scheduleId = activePersonaSession?.scheduleId;
	const personaId = activePersonaSession?.personaId || 'unknown-persona';
	const scope = JSON.stringify([personaId, userId, scheduleId]);
	const scopeRef = useRef(scope);
	if (scopeRef.current !== scope) {
		scopeRef.current = scope;
		cacheGenerationRef.current++;
		latestLookupRequestRef.current++;
		scheduleCacheRef.current.clear();
	}
	useEffect(() => {
		mountedRef.current = true;
		return () => {
			mountedRef.current = false;
			cacheGenerationRef.current++;
			latestLookupRequestRef.current++;
		};
	}, []);
	useEffect(() => {
		setEvents([]);
	}, [scope]);

	async function refetchEvents() {
		if (!enabled || !userId || daysInView <= 0) return;
		const request = ++latestLookupRequestRef.current;
		const generation = ++cacheGenerationRef.current;
		const current = () =>
			mountedRef.current &&
			scopeRef.current === scope &&
			latestLookupRequestRef.current === request &&
			cacheGenerationRef.current === generation;

		setLoading(true);

		// Clear the entire cache so stale prefetched ranges are discarded
		scheduleCacheRef.current = new Map();

		const start = viewOptions.startDay.valueOf();
		const end = start + TimeUtil.inMilliseconds(daysInView, 'd');

		// Re-fetch the current visible range
		try {
			const refreshedEvents = await fetchSchedule(userId, start, end, false, generation);
			if (!current()) return;
			setEvents(refreshedEvents);
		} finally {
			if (current()) setLoading(false);
		}
		if (!current()) return;

		// Re-prefetch adjacent ranges so swiping is still instant
		const nextStart = end;
		const nextEnd = nextStart + TimeUtil.inMilliseconds(daysInView, 'd');
		void fetchSchedule(userId, nextStart, nextEnd, false, generation).catch(() => {});

		const prevEnd = start;
		const prevStart = prevEnd - TimeUtil.inMilliseconds(daysInView, 'd');
		void fetchSchedule(userId, prevStart, prevEnd, false, generation).catch(() => {});
	}

	function makeCacheKey(
		uid: string,
		start: number,
		end: number,
		schedId: string | null | undefined,
		personaId: string
	) {
		return `${personaId}-${uid}-${start}-${end}-${schedId || 'no-schedule'}`;
	}

	function enforceMaxCacheSize() {
		const cache = scheduleCacheRef.current;
		if (cache.size > MAX_CACHE_ENTRIES) {
			const firstKey = cache.keys().next().value || '';
			cache.delete(firstKey);
		}
	}

	async function fetchSchedule(
		id: string,
		startRange: number,
		endRange: number,
		useCache = true,
		generation = cacheGenerationRef.current
	) {
		const cacheKey = makeCacheKey(id, startRange, endRange, scheduleId || null, personaId);

		if (isDemoMode()) {
			const { calendarEvents } = getDemoData();
			return calendarEvents;
		}

		if (useCache) {
			const cached = scheduleCacheRef.current.get(cacheKey);
			if (cached) {
				return cached;
			}
		}

		const lookup = await scheduleService.lookupScheduleByUserId(id, {
			startRange,
			endRange,
		});

		if (
			mountedRef.current &&
			scopeRef.current === scope &&
			cacheGenerationRef.current === generation
		) {
			scheduleCacheRef.current.set(cacheKey, lookup.subCalendarEvents);
			enforceMaxCacheSize();
		}
		return lookup.subCalendarEvents;
	}

	useEffect(() => {
		if (!enabled || !userId || daysInView <= 0) return;

		const start = viewOptions.startDay.valueOf();
		const end = start + TimeUtil.inMilliseconds(daysInView, 'd');

		const request = ++latestLookupRequestRef.current;
		const generation = cacheGenerationRef.current;
		const current = () =>
			mountedRef.current &&
			scopeRef.current === scope &&
			latestLookupRequestRef.current === request;

		setLoading(true);

		// Fetch current range
		fetchSchedule(userId, start, end)
			.then((evts) => {
				if (!current()) return;
				setEvents(evts);
			})
			.catch(() => {
				/* Retain the last visible schedule when a read fails. */
			})
			.finally(() => {
				if (current()) setLoading(false);
			});

		// Prefetch next
		const nextStart = end;
		const nextEnd = nextStart + TimeUtil.inMilliseconds(daysInView, 'd');
		void fetchSchedule(userId, nextStart, nextEnd, false, generation).catch(() => {});

		// Prefetch previous
		const prevEnd = start;
		const prevStart = prevEnd - TimeUtil.inMilliseconds(daysInView, 'd');
		void fetchSchedule(userId, prevStart, prevEnd, false, generation).catch(() => {});
		return () => {
			latestLookupRequestRef.current++;
		};
	}, [enabled, userId, viewOptions.startDay, daysInView, scheduleId, personaId]);

	return { events, loading: loading || !enabled, refetchEvents };
}
