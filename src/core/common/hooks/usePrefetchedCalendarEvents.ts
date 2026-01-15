import { useEffect, useRef, useState } from 'react';
import TimeUtil from '../../util/time';
import { scheduleService } from '@/services';
import { ScheduleSubCalendarEvent } from '../types/schedule';
import useAppStore from '../../../global_state';
import dayjs from 'dayjs';
import { getDemoData, isDemoMode } from '@/config/demo_config';

export default function usePrefetchedCalendarData({
  userId,
  viewOptions,
  daysInView,
}: {
  userId: string | null;
  viewOptions: { startDay: dayjs.Dayjs; daysInView: number };
  daysInView: number;
}) {
  const MAX_CACHE_ENTRIES = 12;

  const latestLookupRequestRef = useRef<string | null>(null);
  const scheduleCacheRef = useRef<Map<string, Array<ScheduleSubCalendarEvent>>>(new Map());
  const scheduleCache = scheduleCacheRef.current;

  const [events, setEvents] = useState<Array<ScheduleSubCalendarEvent>>([]);
  const [loading, setLoading] = useState(true);

  // Get scheduleId from the active persona session to ensure consistency
  const activeSessionType = useAppStore((state) => state.activeSessionType);
  const activePersonaSession = useAppStore((state) => activeSessionType === 'anonymous' ? state.anonymousPersonaSession : state.authenticatedPersonaSession);
  const scheduleId = activePersonaSession?.scheduleId;

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
    if (scheduleCache.size > MAX_CACHE_ENTRIES) {
      const firstKey = scheduleCache.keys().next().value || '';
      scheduleCache.delete(firstKey);
    }
  }

  async function fetchSchedule(
    id: string,
    startRange: number,
    endRange: number,
    useCache = true
  ) {
    const personaId = activePersonaSession?.personaId || 'unknown-persona';
    const cacheKey = makeCacheKey(
      id,
      startRange,
      endRange,
      scheduleId || null,
      personaId
    );
    
    if (isDemoMode()) {
      const { calendarEvents } = getDemoData();
      return calendarEvents;
    }

    if (useCache) {
      const cached = scheduleCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const lookup = await scheduleService.lookupScheduleByUserId(id, {
      startRange,
      endRange,
    });

    scheduleCache.set(cacheKey, lookup.subCalendarEvents);
    enforceMaxCacheSize();
    return lookup.subCalendarEvents;
  }

  useEffect(() => {
    if (!userId || daysInView <= 0) return;

    const start = viewOptions.startDay.valueOf();
    const end = start + TimeUtil.inMilliseconds(daysInView, 'd');

    const requestKey = makeCacheKey(
      userId,
      start,
      end,
      scheduleId,
      activePersonaSession?.personaId || 'unknown-persona'
    );
    latestLookupRequestRef.current = requestKey;

    setLoading(true);

    // Fetch current range
    fetchSchedule(userId, start, end).then((evts) => {
      if (latestLookupRequestRef.current !== requestKey) return;
      setEvents(evts);
      setLoading(false);
    });

    // Prefetch next
    const nextStart = end;
    const nextEnd = nextStart + TimeUtil.inMilliseconds(daysInView, 'd');
    fetchSchedule(userId, nextStart, nextEnd, false);

    // Prefetch previous
    const prevEnd = start;
    const prevStart = prevEnd - TimeUtil.inMilliseconds(daysInView, 'd');
    fetchSchedule(userId, prevStart, prevEnd, false);
  }, [userId, viewOptions.startDay, daysInView, scheduleId]);

  return { events, loading };
}
