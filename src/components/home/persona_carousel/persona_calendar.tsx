import React from 'react';
import { useEffect, useState } from 'react';
import { ScheduleSubCalendarEvent } from '../../../core/common/types/schedule';
import Calendar from '../../../core/common/components/calendar/calendar';
import TimeUtil from '../../../core/util/time';
import useCalendarView from '../../../core/common/hooks/useCalendarView';
import { scheduleService } from '@/services';
import useAppStore from '../../../global_state';

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

  // Get a reference to the view container
  const viewRef = React.useRef<HTMLUListElement>(null);
  const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

  // Fetch schedule data
  async function fetchSchedule(id: string) {
    if (viewOptions.daysInView <= 0) return;
    const startRange = viewOptions.startDay.valueOf();
    const endRange = startRange + TimeUtil.inMilliseconds(viewOptions.daysInView, 'd');

    try {
      setEventsLoading(true);
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
    if (userId) {
      fetchSchedule(userId);
    }
  }, [userId, scheduleId, viewOptions.daysInView, viewOptions.startDay]);

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
