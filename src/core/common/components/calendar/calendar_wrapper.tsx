import React from 'react';
import Calendar from '@/core/common/components/calendar/calendar';
import usePrefetchedCalendarData from '@/core/common/hooks/usePrefetchedCalendarEvents';
import useCalendarView from '@/core/common/hooks/useCalendarView';
import { useScheduleSocket } from '@/hooks/useScheduleSocket';

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
