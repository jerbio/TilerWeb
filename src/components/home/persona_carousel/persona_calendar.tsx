import React from 'react';
import { useEffect, useState } from 'react';
import { ScheduleSubCalendarEvent } from '../../../core/common/types/schedule';
import Calendar from '../../../core/common/components/calendar/calendar';
import TimeUtil from '../../../core/util/time';
import useCalendarView from '../../../core/common/hooks/useCalendarView';
import { scheduleService } from '@/services';
import useAppStore from '../../../global_state';
import { usePersonaSession } from '@/core/common/hooks/usePersonaSessionManager';

type PersonaCalendarProps = {
  userId: string | null;
  expandedWidth: number;
};

function PersonaCalendar({ expandedWidth: width, userId }: PersonaCalendarProps) {
  const MAX_CACHE_ENTRIES = 8;
  const latestLookupRequestRef = React.useRef<string | null>(null);
	const scheduleCacheRef = React.useRef<Map<string, Array<ScheduleSubCalendarEvent>>>(new Map());
	const scheduleCache = scheduleCacheRef.current;
  function makeCacheKey(userId: string, start: number, end: number) {
    return `${userId}-${start}-${end}`;
  }

  const [events, setEvents] = useState<Array<ScheduleSubCalendarEvent>>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Get scheduleId from the active persona session to ensure consistency
  const activePersonaSession = useAppStore((state) => state.activePersonaSession);
  const scheduleId = activePersonaSession?.scheduleId;

  // Use PersonaSessionManager hook for reactive session updates
  // This automatically re-renders when session changes (userId, dev override, etc.)
  const session = usePersonaSession(undefined, (updatedSession) => {
    console.log('[PersonaCalendar] Session updated, will re-fetch schedule:', updatedSession);
  });

  // Use the session's userId if available (includes dev override updates)
  // Fall back to the prop userId for backwards compatibility
  const effectiveUserId = session?.userId || userId;

  // Get a reference to the view container
  const viewRef = React.useRef<HTMLUListElement>(null);
  const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

  // Delete the least recently used cache entry
  function enforceMaxCacheSize() {
    if (scheduleCache.size > MAX_CACHE_ENTRIES) {
			console.log('enforcing max cache size');
      const firstKey = scheduleCache.keys().next().value || '';
      scheduleCache.delete(firstKey);
    }
  }

  // Fetch schedule data
  async function fetchSchedule(
    id: string,
    startRange: number,
    endRange: number,
    useCache = true
  ): Promise<Array<ScheduleSubCalendarEvent>> {
    const cacheKey = makeCacheKey(id, startRange, endRange);
    if (useCache) {
      console.log(scheduleCache)
      console.log(cacheKey);
      console.log(scheduleCache.has(cacheKey));
    }

    if (useCache && scheduleCache.has(cacheKey)) {
      console.log('using cache')
      return scheduleCache.get(cacheKey) || [];
    }

    const scheduleLookup = await scheduleService.lookupScheduleByUserId(id, {
      startRange,
      endRange,
    });

    scheduleCache.set(cacheKey, scheduleLookup.subCalendarEvents);
    enforceMaxCacheSize();
    return scheduleLookup.subCalendarEvents;
  }

  useEffect(() => {
    if (!effectiveUserId || viewOptions.daysInView <= 0) return;

    const start = viewOptions.startDay.valueOf();
    const end = start + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');

    const requestKey = makeCacheKey(effectiveUserId, start, end);
    latestLookupRequestRef.current = requestKey;

    setEventsLoading(true);

    // Fetching the current view
    fetchSchedule(effectiveUserId, start, end).then((events) => {
      if (latestLookupRequestRef.current !== requestKey) return;
      setEvents(events);
      setEventsLoading(false);
    });

    // Prefetching the next view
    const nextStart = end;
    const nextEnd = nextStart + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');
    fetchSchedule(effectiveUserId, nextStart, nextEnd, false);

    // Prefetching the previous view
    const prevEnd = start;
    const prevStart = prevEnd - TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');
    fetchSchedule(effectiveUserId, prevStart, prevEnd, false);
  }, [effectiveUserId, scheduleId, viewOptions.daysInView, viewOptions.startDay]);

  return (
    <Calendar
      viewOptions={viewOptions}
      setViewOptions={setViewOptions}
      events={events}
      eventsLoading={eventsLoading}
      viewRef={viewRef}
    />
  );
}

export default PersonaCalendar;
