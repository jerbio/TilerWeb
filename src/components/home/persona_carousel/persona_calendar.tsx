import React from 'react';
import { useEffect, useState } from 'react';
import { ScheduleSubCalendarEvent } from '../../../core/common/types/schedule';
import Calendar from '../../../core/common/components/calendar/calendar';
import TimeUtil from '../../../core/util/time';
import useCalendarView from '../../../core/common/hooks/useCalendarView';
import { scheduleService } from '@/services';
import useAppStore from '../../../global_state';
import { usePersonaSession } from '@/core/common/hooks/usePersonaSessionManager';
import { isDemoMode, getDemoData } from '@/config/demo_config';

type PersonaCalendarProps = {
  userId: string | null;
  expandedWidth: number;
};

function PersonaCalendar({ expandedWidth: width, userId }: PersonaCalendarProps) {
  const [events, setEvents] = useState<Array<ScheduleSubCalendarEvent>>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Get scheduleId from the active persona session to ensure consistency
  const activePersonaSession = useAppStore((state) => state.activePersonaSession);
  const scheduleId = activePersonaSession?.scheduleId;
  
  // Use PersonaSessionManager hook for reactive session updates
  // This automatically re-renders when session changes (userId, dev override, etc.)
  const session = usePersonaSession();
  
  // Use the session's userId if available (includes dev override updates)
  // Fall back to the prop userId for backwards compatibility
  const effectiveUserId = session?.userId || userId;

  // Get a reference to the view container
  const viewRef = React.useRef<HTMLUListElement>(null);
  const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

  // Fetch schedule data
  async function fetchSchedule(id: string) {
    if (viewOptions.daysInView <= 0) return;
    
    // Dev mode takes priority - always fetch from API with dev userId
    const devUserIdOverride = useAppStore.getState().devUserIdOverride;
    const isDevMode = !!devUserIdOverride;
    
    const startRange = viewOptions.startDay.valueOf();
    const endRange = startRange + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');

    try {
      setEventsLoading(true);
      
      // Priority 1: Dev mode - always use API with override userId (skip demo)
      if (isDevMode) {
        const scheduleLookup = await scheduleService.lookupScheduleByUserId(id, {
          startRange,
          endRange,
        });
        setEvents(scheduleLookup.subCalendarEvents);
        setEventsLoading(false);
        return;
      }
      
      // Priority 2: Demo mode - inject demo data
      if (isDemoMode()) {
        const { calendarEvents } = getDemoData();
        setEvents(calendarEvents);
        setEventsLoading(false);
        return;
      }
      
      // Priority 3: Normal mode - fetch from API
      const scheduleLookup = await scheduleService.lookupScheduleByUserId(id, {
        startRange,
        endRange,
      });
      setEvents(scheduleLookup.subCalendarEvents);
    } catch (error) {
      console.error('Error fetching persona schedule events: ', error);
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    // Priority: Demo mode > Normal operation (Dev mode check is inside fetchSchedule)
    if (isDemoMode()) {
      // Demo mode - inject demo events (skip API call)
      const { calendarEvents } = getDemoData();
      setEvents(calendarEvents);
      setEventsLoading(false);
    } else if (effectiveUserId) {
      // Normal/Dev mode with userId - fetch from API (dev mode handled inside fetchSchedule)
      fetchSchedule(effectiveUserId);
    }
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
