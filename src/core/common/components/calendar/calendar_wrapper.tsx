import React, { useEffect } from "react";
import Calendar from "@/core/common/components/calendar/calendar";
import usePrefetchedCalendarData from "@/core/common/hooks/usePrefetchedCalendarEvents";
import useCalendarView from "@/core/common/hooks/useCalendarView";
import { useScheduleSocket } from "@/hooks/useScheduleSocket";
import { useCalendarUI } from "./calendar-ui.provider";

export function CalendarWrapper({
  chatExpanded,
  userId,
  width,
  allowEventLookup = true,
}: {
  chatExpanded?: boolean;
  userId: string | null;
  width: number;
  allowEventLookup?: boolean;
}) {
  const viewRef = React.useRef<HTMLUListElement>(null);

  const { viewOptions, setViewOptions } = useCalendarView(viewRef, width, chatExpanded);

  const setViewInfo = useCalendarUI((s) => s.setViewInfo);
  useEffect(() => {
    setViewInfo({ startDay: viewOptions.startDay, daysInView: viewOptions.daysInView });
  }, [viewOptions.startDay, viewOptions.daysInView, setViewInfo]);

  const { events, loading, refetchEvents } = usePrefetchedCalendarData({
    userId,
    viewOptions,
    daysInView: viewOptions.daysInView,
  });

  // Auto-refetch calendar events when a schedule change is detected via WebSocket
  useScheduleSocket(refetchEvents);

  return (
    <Calendar
      viewOptions={viewOptions}
      setViewOptions={setViewOptions}
      events={events}
      eventsLoading={loading}
      viewRef={viewRef}
			refetchEvents={refetchEvents}
      allowEventLookup={allowEventLookup}
    />
  );
}
