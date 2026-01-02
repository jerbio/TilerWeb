import React from "react";
import Calendar from "@/core/common/components/calendar/calendar";
import usePrefetchedCalendarData from "@/core/common/hooks/usePrefetchedCalendarEvents";
import useCalendarView from "@/core/common/hooks/useCalendarView";

export function CalendarWrapper({
  userId,
  width,
}: {
  userId: string | null;
  width: number;
}) {
  const viewRef = React.useRef<HTMLUListElement>(null);

  const { viewOptions, setViewOptions } = useCalendarView(viewRef, width);

  const { events, loading } = usePrefetchedCalendarData({
    userId,
    viewOptions,
    daysInView: viewOptions.daysInView,
  });

  return (
    <Calendar
      viewOptions={viewOptions}
      setViewOptions={setViewOptions}
      events={events}
      eventsLoading={loading}
      viewRef={viewRef}
    />
  );
}
